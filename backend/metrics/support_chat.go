package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"html"
	"io"
	"net/http"
	"strings"
	"time"
)

const supportTranscriptAdminRecipient = "admin@diworkin.com"

type supportConversationItem struct {
	ID                int64  `json:"id"`
	Channel           string `json:"channel"`
	VisitorName       string `json:"visitor_name"`
	VisitorEmail      string `json:"visitor_email"`
	VisitorCompany    string `json:"visitor_company"`
	PageURL           string `json:"page_url"`
	Referrer          string `json:"referrer"`
	Status            string `json:"status"`
	LastMessageRole   string `json:"last_message_role"`
	LastMessagePreview string `json:"last_message_preview"`
	LastMessageAt     string `json:"last_message_at"`
	UnreadForAdmin    bool   `json:"unread_for_admin"`
	UnreadForVisitor  bool   `json:"unread_for_visitor"`
	MessageCount      int64  `json:"message_count"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
	ClosedAt          string `json:"closed_at,omitempty"`
	TranscriptSentAt  string `json:"transcript_sent_at,omitempty"`
}

type supportMessageItem struct {
	ID            int64  `json:"id"`
	ConversationID int64 `json:"conversation_id"`
	SenderRole    string `json:"sender_role"`
	SenderEmail   string `json:"sender_email"`
	Body          string `json:"body"`
	CreatedAt     string `json:"created_at"`
}

type supportConversationBundle struct {
	Conversation supportConversationItem `json:"conversation"`
	Messages     []supportMessageItem    `json:"messages"`
	Token        string                 `json:"token,omitempty"`
}

type supportPublicStartRequest struct {
	Token      string `json:"token"`
	Channel    string `json:"channel"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Company    string `json:"company"`
	Message    string `json:"message"`
	PageURL    string `json:"page_url"`
	Referrer   string `json:"referrer"`
	Subject    string `json:"subject"`
}

type supportPublicMessageRequest struct {
	Token   string `json:"token"`
	Message string `json:"message"`
}

type supportPublicCloseRequest struct {
	Token string `json:"token"`
}

type supportAdminReplyRequest struct {
	ID      int64  `json:"id"`
	Message string `json:"message"`
	Status  string `json:"status"`
}

func (s *server) ensureSupportChatSchema() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS panel_support_conversations (
			id BIGSERIAL PRIMARY KEY,
			visitor_token_hash TEXT NOT NULL UNIQUE,
			channel TEXT NOT NULL DEFAULT 'support',
			visitor_name TEXT NOT NULL DEFAULT '',
			visitor_email TEXT NOT NULL DEFAULT '',
			visitor_company TEXT NOT NULL DEFAULT '',
			page_url TEXT NOT NULL DEFAULT '',
			referrer TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'open',
			last_message_role TEXT NOT NULL DEFAULT 'visitor',
			last_message_preview TEXT NOT NULL DEFAULT '',
			last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			unread_for_admin BOOLEAN NOT NULL DEFAULT TRUE,
			unread_for_visitor BOOLEAN NOT NULL DEFAULT FALSE,
			admin_last_seen_at TIMESTAMPTZ NULL,
			visitor_last_seen_at TIMESTAMPTZ NULL,
			closed_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_support_messages (
			id BIGSERIAL PRIMARY KEY,
			conversation_id BIGINT NOT NULL REFERENCES panel_support_conversations(id) ON DELETE CASCADE,
			sender_role TEXT NOT NULL DEFAULT 'visitor',
			sender_email TEXT NOT NULL DEFAULT '',
			body TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_support_conversations ADD COLUMN IF NOT EXISTS transcript_sent_at TIMESTAMPTZ NULL`,
		`CREATE INDEX IF NOT EXISTS panel_support_conversations_channel_idx ON panel_support_conversations (channel)`,
		`CREATE INDEX IF NOT EXISTS panel_support_conversations_status_idx ON panel_support_conversations (status)`,
		`CREATE INDEX IF NOT EXISTS panel_support_conversations_last_message_at_idx ON panel_support_conversations (last_message_at DESC)`,
		`CREATE INDEX IF NOT EXISTS panel_support_conversations_unread_for_admin_idx ON panel_support_conversations (unread_for_admin)`,
		`CREATE INDEX IF NOT EXISTS panel_support_messages_conversation_id_idx ON panel_support_messages (conversation_id)`,
	}

	for _, stmt := range stmts {
		if _, err := s.db.Exec(stmt); err != nil {
			return err
		}
	}

	return nil
}

func isAllowedSupportOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	if strings.EqualFold(origin, "https://diworkin.com") || strings.EqualFold(origin, "https://www.diworkin.com") {
		return true
	}
	return strings.HasSuffix(strings.ToLower(origin), ".diworkin.com")
}

func (s *server) withSupportPublicCORS(handler func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if isAllowedSupportOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
			w.Header().Add("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		handler(w, r)
	}
}

func (s *server) supportPublicStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeSupportPublicStartRequest(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	message := normalizeSupportMessage(req.Message)
	if message == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}

	channel := normalizeSupportChannel(req.Channel)
	visitorToken := strings.TrimSpace(req.Token)

	ctx := r.Context()
	var bundle supportConversationBundle
	err = withTx(s.db, func(tx *sql.Tx) error {
		var conversationID int64
		var token string

		if visitorToken != "" {
			tokenHash := s.hashToken(visitorToken)
			row := tx.QueryRowContext(ctx, `
				SELECT id
				FROM panel_support_conversations
				WHERE visitor_token_hash = $1
			`, tokenHash)
			if scanErr := row.Scan(&conversationID); scanErr == nil {
				token = visitorToken
			} else if !errors.Is(scanErr, sql.ErrNoRows) {
				return scanErr
			}
		}

		if conversationID == 0 {
			nextToken, err := randomToken(32)
			if err != nil {
				return err
			}
			token = nextToken
			tokenHash := s.hashToken(token)
			result, err := tx.ExecContext(ctx, `
				INSERT INTO panel_support_conversations (
					visitor_token_hash,
					channel,
					visitor_name,
					visitor_email,
					visitor_company,
					page_url,
					referrer,
					status,
					last_message_role,
					last_message_preview,
					last_message_at,
					unread_for_admin,
					unread_for_visitor,
					created_at,
					updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', 'visitor', $8, NOW(), TRUE, FALSE, NOW(), NOW())
			`, tokenHash, channel, sanitizeSupportText(req.Name, 120), sanitizeSupportText(req.Email, 180), sanitizeSupportText(req.Company, 180), sanitizeSupportText(req.PageURL, 512), sanitizeSupportText(req.Referrer, 512), supportPreview(message))
			if err != nil {
				return err
			}
			conversationID, err = result.LastInsertId()
			if err != nil || conversationID == 0 {
				lookupErr := tx.QueryRowContext(ctx, `
					SELECT id
					FROM panel_support_conversations
					WHERE visitor_token_hash = $1
				`, tokenHash).Scan(&conversationID)
				if lookupErr != nil {
					return lookupErr
				}
			}
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO panel_support_messages (conversation_id, sender_role, sender_email, body, created_at)
			VALUES ($1, 'visitor', $2, $3, NOW())
		`, conversationID, sanitizeSupportText(req.Email, 180), message); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			UPDATE panel_support_conversations
			SET channel = $2,
			    visitor_name = COALESCE(NULLIF($3, ''), visitor_name),
			    visitor_email = COALESCE(NULLIF($4, ''), visitor_email),
			    visitor_company = COALESCE(NULLIF($5, ''), visitor_company),
			    page_url = COALESCE(NULLIF($6, ''), page_url),
			    referrer = COALESCE(NULLIF($7, ''), referrer),
			    last_message_role = 'visitor',
			    last_message_preview = $8,
			    last_message_at = NOW(),
			    unread_for_admin = TRUE,
			    unread_for_visitor = FALSE,
			    status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
			    updated_at = NOW()
			WHERE id = $1
		`, conversationID, channel, sanitizeSupportText(req.Name, 120), sanitizeSupportText(req.Email, 180), sanitizeSupportText(req.Company, 180), sanitizeSupportText(req.PageURL, 512), sanitizeSupportText(req.Referrer, 512), supportPreview(message)); err != nil {
			return err
		}

		bundle, err = s.loadSupportBundleTx(tx, ctx, conversationID, token, false)
		return err
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, bundle)
}

func (s *server) supportPublicThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		writeError(w, http.StatusBadRequest, "token is required")
		return
	}

	tokenHash := s.hashToken(token)
	ctx := r.Context()

	var conversationID int64
	if err := s.db.QueryRowContext(ctx, `
		SELECT id
		FROM panel_support_conversations
		WHERE visitor_token_hash = $1
	`, tokenHash).Scan(&conversationID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "conversation not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if _, err := s.db.ExecContext(ctx, `
		UPDATE panel_support_conversations
		SET visitor_last_seen_at = NOW(),
		    unread_for_visitor = FALSE,
		    updated_at = NOW()
		WHERE id = $1
	`, conversationID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	bundle, err := s.loadSupportBundleByID(ctx, conversationID, token, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, bundle)
}

func (s *server) supportPublicMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeSupportPublicMessageRequest(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	message := normalizeSupportMessage(req.Message)
	if message == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}

	token := strings.TrimSpace(req.Token)
	if token == "" {
		writeError(w, http.StatusBadRequest, "token is required")
		return
	}

	ctx := r.Context()
	tokenHash := s.hashToken(token)
	var conversationID int64
	if err := s.db.QueryRowContext(ctx, `
		SELECT id
		FROM panel_support_conversations
		WHERE visitor_token_hash = $1
	`, tokenHash).Scan(&conversationID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "conversation not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := withTxExec(s.db, func(tx *sql.Tx) error {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO panel_support_messages (conversation_id, sender_role, sender_email, body, created_at)
			VALUES ($1, 'visitor', '', $2, NOW())
		`, conversationID, message); err != nil {
			return err
		}
		_, err := tx.ExecContext(ctx, `
			UPDATE panel_support_conversations
			SET last_message_role = 'visitor',
			    last_message_preview = $2,
			    last_message_at = NOW(),
			    unread_for_admin = TRUE,
			    unread_for_visitor = FALSE,
			    updated_at = NOW()
			WHERE id = $1
		`, conversationID, supportPreview(message))
		return err
	}); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	bundle, err := s.loadSupportBundleByID(ctx, conversationID, token, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, bundle)
}

func (s *server) supportPublicClose(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeSupportPublicCloseRequest(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	token := strings.TrimSpace(req.Token)
	if token == "" {
		writeError(w, http.StatusBadRequest, "token is required")
		return
	}

	ctx := r.Context()
	tokenHash := s.hashToken(token)
	var conversationID int64
	if err := s.db.QueryRowContext(ctx, `
		SELECT id
		FROM panel_support_conversations
		WHERE visitor_token_hash = $1
	`, tokenHash).Scan(&conversationID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "conversation not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := s.updateSupportConversationStatus(ctx, conversationID, "closed"); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "conversation not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	bundle, err := s.loadSupportBundleByID(ctx, conversationID, token, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := s.sendSupportTranscriptIfNeeded(ctx, bundle.Conversation, bundle.Messages); err != nil {
		log.Printf("support transcript send failed for conversation %d: %v", conversationID, err)
	}

	writeJSON(w, http.StatusOK, bundle)
}

func (s *server) supportAdminInbox(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	channel := normalizeSupportChannel(r.URL.Query().Get("channel"))
	status := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))

	query := `
		SELECT id, channel, visitor_name, visitor_email, visitor_company, page_url, referrer, status,
		       last_message_role, last_message_preview, last_message_at,
		       unread_for_admin, unread_for_visitor,
		       created_at, updated_at, closed_at, transcript_sent_at,
		       (
		         SELECT COUNT(*)
		         FROM panel_support_messages sm
		         WHERE sm.conversation_id = c.id
		       ) AS message_count
		FROM panel_support_conversations c
		WHERE channel = $1
	`
	args := []any{channel}
	if status != "" && status != "all" {
		query += ` AND status = $2`
		args = append(args, status)
	}
	query += ` ORDER BY last_message_at DESC, id DESC LIMIT 100`

	rows, err := s.db.QueryContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	items := make([]supportConversationItem, 0)
	for rows.Next() {
		item, scanErr := scanSupportConversationRow(rows)
		if scanErr != nil {
			writeError(w, http.StatusInternalServerError, scanErr.Error())
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"conversations": items,
		"channel":       channel,
		"status":        status,
	})
}

func (s *server) supportAdminThread(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		id, err := parseSupportIDQuery(r)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if id == 0 {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		if _, err := s.db.ExecContext(r.Context(), `
			UPDATE panel_support_conversations
			SET unread_for_admin = FALSE,
			    admin_last_seen_at = NOW(),
			    updated_at = NOW()
			WHERE id = $1
		`, id); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		bundle, err := s.loadSupportBundleByID(r.Context(), id, "", true)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "conversation not found")
				return
			}
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, bundle)
	case http.MethodPost:
		req, err := decodeSupportAdminReplyRequest(r)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		message := normalizeSupportMessage(req.Message)
		if req.ID == 0 {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		if message == "" && normalizeSupportStatus(req.Status) != "" {
			if err := s.updateSupportConversationStatus(r.Context(), req.ID, req.Status); err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					writeError(w, http.StatusNotFound, "conversation not found")
					return
				}
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
			bundle, err := s.loadSupportBundleByID(r.Context(), req.ID, "", true)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
			if err := s.sendSupportTranscriptIfNeeded(r.Context(), bundle.Conversation, bundle.Messages); err != nil {
				log.Printf("support transcript send failed for conversation %d: %v", req.ID, err)
			}
		} else {
			if message == "" {
				writeError(w, http.StatusBadRequest, "message is required")
				return
			}
			if err := s.appendAdminReply(r.Context(), req.ID, sess.Email, message, req.Status); err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					writeError(w, http.StatusNotFound, "conversation not found")
					return
				}
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		}
		bundle, err := s.loadSupportBundleByID(r.Context(), req.ID, "", true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if bundle.Conversation.Status == "closed" {
			if err := s.sendSupportTranscriptIfNeeded(r.Context(), bundle.Conversation, bundle.Messages); err != nil {
				log.Printf("support transcript send failed for conversation %d: %v", req.ID, err)
			}
		}
		writeJSON(w, http.StatusOK, bundle)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) updateSupportConversationStatus(ctx context.Context, id int64, status string) error {
	targetStatus := normalizeSupportStatus(status)
	if targetStatus == "" {
		return sql.ErrNoRows
	}

	return withTxExec(s.db, func(tx *sql.Tx) error {
		result, err := tx.ExecContext(ctx, `
			UPDATE panel_support_conversations
			SET status = $2,
			    closed_at = CASE WHEN $2 = 'closed' THEN NOW() ELSE NULL END,
			    unread_for_admin = CASE WHEN $2 = 'closed' THEN FALSE ELSE unread_for_admin END,
			    unread_for_visitor = CASE WHEN $2 = 'closed' THEN FALSE ELSE unread_for_visitor END,
			    updated_at = NOW()
			WHERE id = $1
		`, id, targetStatus)
		if err != nil {
			return err
		}
		affected, _ := result.RowsAffected()
		if affected == 0 {
			return sql.ErrNoRows
		}
		return nil
	})
}

func (s *server) appendAdminReply(ctx context.Context, id int64, email, message, status string) error {
	targetStatus := normalizeSupportStatus(status)
	return withTxExec(s.db, func(tx *sql.Tx) error {
		result, err := tx.ExecContext(ctx, `
			INSERT INTO panel_support_messages (conversation_id, sender_role, sender_email, body, created_at)
			VALUES ($1, 'admin', $2, $3, NOW())
		`, id, sanitizeSupportText(email, 180), message)
		if err != nil {
			return err
		}
		if rows, _ := result.RowsAffected(); rows == 0 {
			return sql.ErrNoRows
		}
		updateQuery := `
			UPDATE panel_support_conversations
			SET last_message_role = 'admin',
			    last_message_preview = $2,
			    last_message_at = NOW(),
			    unread_for_admin = FALSE,
			    unread_for_visitor = TRUE,
			    admin_last_seen_at = NOW(),
			    updated_at = NOW()
		`
		args := []any{id, supportPreview(message)}
		if targetStatus != "" {
			updateQuery += `, status = $3`
			args = append(args, targetStatus)
			if targetStatus == "closed" {
				updateQuery += `, closed_at = NOW()`
			} else {
				updateQuery += `, closed_at = NULL`
			}
		}
		updateQuery += ` WHERE id = $1`
		_, err = tx.ExecContext(ctx, updateQuery, args...)
		return err
	})
}

func (s *server) sendSupportTranscriptIfNeeded(ctx context.Context, conversation supportConversationItem, messages []supportMessageItem) error {
	if conversation.Status != "closed" || strings.TrimSpace(conversation.TranscriptSentAt) != "" {
		return nil
	}

	htmlBody, textBody := buildSupportTranscriptBodies(conversation, messages)
	subject := fmt.Sprintf("Diworkin support chat transcript - %s", supportChannelLabel(conversation.Channel))

	if visitorEmail := strings.TrimSpace(conversation.VisitorEmail); visitorEmail != "" {
		if err := s.sendEmail(visitorEmail, subject, htmlBody, textBody); err != nil {
			return err
		}
	}
	if err := s.sendEmail(supportTranscriptAdminRecipient, subject, htmlBody, textBody); err != nil {
		return err
	}

	_, err := s.db.ExecContext(ctx, `
		UPDATE panel_support_conversations
		SET transcript_sent_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1 AND transcript_sent_at IS NULL
	`, conversation.ID)
	return err
}

func (s *server) loadSupportBundleByID(ctx context.Context, id int64, token string, isAdmin bool) (supportConversationBundle, error) {
	var conversation supportConversationItem
	query := `
		SELECT id, channel, visitor_name, visitor_email, visitor_company, page_url, referrer, status,
		       last_message_role, last_message_preview, last_message_at,
		       unread_for_admin, unread_for_visitor,
		       created_at, updated_at, closed_at, transcript_sent_at,
		       (
		         SELECT COUNT(*)
		         FROM panel_support_messages sm
		         WHERE sm.conversation_id = c.id
		       ) AS message_count
		FROM panel_support_conversations c
		WHERE id = $1
	`
	row := s.db.QueryRowContext(ctx, query, id)
	if item, err := scanSupportConversationRow(row); err != nil {
		return supportConversationBundle{}, err
	} else {
		conversation = item
	}

	if !isAdmin && token != "" {
		_, _ = s.db.ExecContext(ctx, `
			UPDATE panel_support_conversations
			SET visitor_last_seen_at = NOW(),
			    unread_for_visitor = FALSE,
			    updated_at = NOW()
			WHERE id = $1
		`, id)
	}

	messages, err := s.loadSupportMessages(ctx, id)
	if err != nil {
		return supportConversationBundle{}, err
	}

	return supportConversationBundle{
		Conversation: conversation,
		Messages:     messages,
		Token:        token,
	}, nil
}

func (s *server) loadSupportBundleTx(tx *sql.Tx, ctx context.Context, id int64, token string, isAdmin bool) (supportConversationBundle, error) {
	var conversation supportConversationItem
	row := tx.QueryRowContext(ctx, `
		SELECT id, channel, visitor_name, visitor_email, visitor_company, page_url, referrer, status,
		       last_message_role, last_message_preview, last_message_at,
		       unread_for_admin, unread_for_visitor,
		       created_at, updated_at, closed_at, transcript_sent_at,
		       (
		         SELECT COUNT(*)
		         FROM panel_support_messages sm
		         WHERE sm.conversation_id = c.id
		       ) AS message_count
		FROM panel_support_conversations c
		WHERE id = $1
	`, id)
	if item, err := scanSupportConversationRow(row); err != nil {
		return supportConversationBundle{}, err
	} else {
		conversation = item
	}
	if !isAdmin && token != "" {
		_, _ = tx.ExecContext(ctx, `
			UPDATE panel_support_conversations
			SET visitor_last_seen_at = NOW(),
			    unread_for_visitor = FALSE,
			    updated_at = NOW()
			WHERE id = $1
		`, id)
	}
	rows, err := tx.QueryContext(ctx, `
		SELECT id, conversation_id, sender_role, sender_email, body, created_at
		FROM panel_support_messages
		WHERE conversation_id = $1
		ORDER BY id ASC
	`, id)
	if err != nil {
		return supportConversationBundle{}, err
	}
	defer rows.Close()

	messages := make([]supportMessageItem, 0)
	for rows.Next() {
		item, scanErr := scanSupportMessageRow(rows)
		if scanErr != nil {
			return supportConversationBundle{}, scanErr
		}
		messages = append(messages, item)
	}
	if err := rows.Err(); err != nil {
		return supportConversationBundle{}, err
	}

	return supportConversationBundle{
		Conversation: conversation,
		Messages:     messages,
		Token:        token,
	}, nil
}

func (s *server) loadSupportMessages(ctx context.Context, conversationID int64) ([]supportMessageItem, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, conversation_id, sender_role, sender_email, body, created_at
		FROM panel_support_messages
		WHERE conversation_id = $1
		ORDER BY id ASC
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]supportMessageItem, 0)
	for rows.Next() {
		item, scanErr := scanSupportMessageRow(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func scanSupportConversationRow(scanner interface {
	Scan(dest ...any) error
}) (supportConversationItem, error) {
	var item supportConversationItem
	var createdAt, updatedAt, closedAt, transcriptSentAt, lastMessageAt time.Time
	var closedAtNull sql.NullTime
	var transcriptSentAtNull sql.NullTime
	if err := scanner.Scan(
		&item.ID,
		&item.Channel,
		&item.VisitorName,
		&item.VisitorEmail,
		&item.VisitorCompany,
		&item.PageURL,
		&item.Referrer,
		&item.Status,
		&item.LastMessageRole,
		&item.LastMessagePreview,
		&lastMessageAt,
		&item.UnreadForAdmin,
		&item.UnreadForVisitor,
		&createdAt,
		&updatedAt,
		&closedAtNull,
		&transcriptSentAtNull,
		&item.MessageCount,
	); err != nil {
		return supportConversationItem{}, err
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	item.LastMessageAt = lastMessageAt.UTC().Format(time.RFC3339)
	if closedAtNull.Valid {
		closedAt = closedAtNull.Time
		item.ClosedAt = closedAt.UTC().Format(time.RFC3339)
	}
	if transcriptSentAtNull.Valid {
		transcriptSentAt = transcriptSentAtNull.Time
		item.TranscriptSentAt = transcriptSentAt.UTC().Format(time.RFC3339)
	}
	return item, nil
}

func scanSupportMessageRow(scanner interface {
	Scan(dest ...any) error
}) (supportMessageItem, error) {
	var item supportMessageItem
	var createdAt time.Time
	if err := scanner.Scan(&item.ID, &item.ConversationID, &item.SenderRole, &item.SenderEmail, &item.Body, &createdAt); err != nil {
		return supportMessageItem{}, err
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return item, nil
}

func normalizeSupportChannel(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "sales":
		return "sales"
	default:
		return "support"
	}
}

func normalizeSupportStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "closed":
		return "closed"
	case "open":
		return "open"
	default:
		return ""
	}
}

func normalizeSupportMessage(value string) string {
	return strings.TrimSpace(strings.ReplaceAll(value, "\r\n", "\n"))
}

func supportChannelLabel(channel string) string {
	switch normalizeSupportChannel(channel) {
	case "sales":
		return "Sales"
	default:
		return "Support"
	}
}

func supportMessageRoleLabel(role string) string {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin":
		return "Support"
	default:
		return "Visitor"
	}
}

func supportMessageBubbleColor(role string) string {
	if strings.EqualFold(role, "admin") {
		return "#eef2ff"
	}
	return "#f8fafc"
}

func formatSupportTranscriptTime(timestamp string) string {
	date, err := time.Parse(time.RFC3339, timestamp)
	if err != nil {
		return "-"
	}
	return date.Local().Format("Jan 2, 2006 3:04 PM")
}

func visitorNameOrFallback(value string) string {
	if strings.TrimSpace(value) == "" {
		return "Anonymous visitor"
	}
	return value
}

func visitorEmailOrFallback(value string) string {
	if strings.TrimSpace(value) == "" {
		return "-"
	}
	return value
}

func visitorCompanyOrFallback(value string) string {
	if strings.TrimSpace(value) == "" {
		return "-"
	}
	return value
}

func valueOrFallback(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func sanitizeSupportText(value string, limit int) string {
	text := strings.TrimSpace(value)
	if limit > 0 && len(text) > limit {
		return text[:limit]
	}
	return text
}

func supportPreview(value string) string {
	text := strings.Join(strings.Fields(normalizeSupportMessage(value)), " ")
	if len(text) > 160 {
		return text[:160]
	}
	return text
}

func buildSupportTranscriptBodies(conversation supportConversationItem, messages []supportMessageItem) (string, string) {
	channelLabel := supportChannelLabel(conversation.Channel)
	visitorName := strings.TrimSpace(conversation.VisitorName)
	visitorEmail := strings.TrimSpace(conversation.VisitorEmail)
	visitorCompany := strings.TrimSpace(conversation.VisitorCompany)
	pageURL := strings.TrimSpace(conversation.PageURL)
	referrer := strings.TrimSpace(conversation.Referrer)
	closedAt := strings.TrimSpace(conversation.ClosedAt)
	if closedAt == "" {
		closedAt = time.Now().UTC().Format(time.RFC3339)
	}

	var htmlMessages strings.Builder
	var textMessages strings.Builder
	for _, message := range messages {
		roleLabel := supportMessageRoleLabel(message.SenderRole)
		messageTime := formatSupportTranscriptTime(message.CreatedAt)
		escapedBody := html.EscapeString(message.Body)
		escapedBody = strings.ReplaceAll(escapedBody, "\n", "<br>")
		textMessages.WriteString(fmt.Sprintf("[%s] %s\n%s\n\n", messageTime, roleLabel, message.Body))
		htmlMessages.WriteString(fmt.Sprintf(
			`<div style="margin:0 0 18px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:14px;background:%s;">
				<div style="font:600 12px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">%s · %s</div>
				<div style="margin-top:8px;font:400 14px/1.75 Arial,sans-serif;color:#111827;white-space:normal;">%s</div>
			</div>`,
			supportMessageBubbleColor(message.SenderRole),
			html.EscapeString(roleLabel),
			html.EscapeString(messageTime),
			escapedBody,
		))
	}

	htmlBody := fmt.Sprintf(`<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
      <div style="padding:24px 24px 10px;border:1px solid #e5e7eb;border-radius:20px;background:#ffffff;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#64748b;">Diworkin Support Transcript</div>
        <h1 style="margin:10px 0 6px;font-size:28px;line-height:1.2;">%s</h1>
        <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">This transcript was generated after the chat was ended.</p>
        <div style="margin-top:18px;padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e5e7eb;">
          <table style="width:100%%;border-collapse:collapse;font-size:14px;line-height:1.7;color:#0f172a;">
            <tr><td style="padding:2px 0;color:#64748b;width:160px;">Channel</td><td style="padding:2px 0;">%s</td></tr>
            <tr><td style="padding:2px 0;color:#64748b;">Visitor</td><td style="padding:2px 0;">%s</td></tr>
            <tr><td style="padding:2px 0;color:#64748b;">Email</td><td style="padding:2px 0;">%s</td></tr>
            <tr><td style="padding:2px 0;color:#64748b;">Company</td><td style="padding:2px 0;">%s</td></tr>
            <tr><td style="padding:2px 0;color:#64748b;">Page URL</td><td style="padding:2px 0;word-break:break-word;">%s</td></tr>
            <tr><td style="padding:2px 0;color:#64748b;">Referrer</td><td style="padding:2px 0;word-break:break-word;">%s</td></tr>
            <tr><td style="padding:2px 0;color:#64748b;">Closed at</td><td style="padding:2px 0;">%s</td></tr>
          </table>
        </div>
      </div>
      <div style="margin-top:18px;padding:24px;border:1px solid #e5e7eb;border-radius:20px;background:#ffffff;">
        <h2 style="margin:0 0 18px;font-size:20px;line-height:1.3;">Conversation</h2>
        %s
      </div>
    </div>
  </body>
</html>`,
		html.EscapeString(channelLabel),
		html.EscapeString(channelLabel),
		html.EscapeString(visitorNameOrFallback(visitorName)),
		html.EscapeString(visitorEmailOrFallback(visitorEmail)),
		html.EscapeString(visitorCompanyOrFallback(visitorCompany)),
		html.EscapeString(valueOrFallback(pageURL, "-")),
		html.EscapeString(valueOrFallback(referrer, "-")),
		html.EscapeString(closedAt),
		htmlMessages.String(),
	)

	textBody := fmt.Sprintf(
		"Diworkin Support Transcript\n\nChannel: %s\nVisitor: %s\nEmail: %s\nCompany: %s\nPage URL: %s\nReferrer: %s\nClosed at: %s\n\nConversation:\n%s",
		channelLabel,
		visitorNameOrFallback(visitorName),
		visitorEmailOrFallback(visitorEmail),
		visitorCompanyOrFallback(visitorCompany),
		valueOrFallback(pageURL, "-"),
		valueOrFallback(referrer, "-"),
		closedAt,
		textMessages.String(),
	)

	return htmlBody, textBody
}

func decodeSupportPublicStartRequest(r *http.Request) (supportPublicStartRequest, error) {
	var req supportPublicStartRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		return supportPublicStartRequest{}, fmt.Errorf("invalid support request")
	}
	return req, nil
}

func decodeSupportPublicMessageRequest(r *http.Request) (supportPublicMessageRequest, error) {
	var req supportPublicMessageRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		return supportPublicMessageRequest{}, fmt.Errorf("invalid support request")
	}
	return req, nil
}

func decodeSupportPublicCloseRequest(r *http.Request) (supportPublicCloseRequest, error) {
	var req supportPublicCloseRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		return supportPublicCloseRequest{}, fmt.Errorf("invalid support request")
	}
	return req, nil
}

func decodeSupportAdminReplyRequest(r *http.Request) (supportAdminReplyRequest, error) {
	var req supportAdminReplyRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		return supportAdminReplyRequest{}, fmt.Errorf("invalid support request")
	}
	return req, nil
}

func parseSupportIDQuery(r *http.Request) (int64, error) {
	raw := strings.TrimSpace(r.URL.Query().Get("id"))
	if raw == "" {
		return 0, nil
	}
	var id int64
	if _, err := fmt.Sscan(raw, &id); err != nil {
		return 0, fmt.Errorf("invalid conversation id")
	}
	return id, nil
}

func withTx(db *sql.DB, fn func(*sql.Tx) error) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()
	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}

func withTxExec(db *sql.DB, fn func(*sql.Tx) error) error {
	return withTx(db, fn)
}
