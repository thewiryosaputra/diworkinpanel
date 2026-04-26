package main

import (
	"archive/tar"
	"bytes"
	"context"
	"compress/gzip"
	"bufio"
	"crypto/aes"
	"crypto/hmac"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"crypto/x509"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"html"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net"
	"net/mail"
	"net/http"
	"net/smtp"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"os/user"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unicode"

	"github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/ssh"
)

const (
	authCookieName    = "diworkin_session"
	mailAuthCookieName = "diworkin_mail_session"
	defaultPort       = "127.0.0.1:8080"
	sessionTTL        = 30 * 24 * time.Hour
	mailSessionTTL    = 30 * 24 * time.Hour
	mailSSOTokenTTL   = 10 * time.Minute
	defaultSitesRoot = "/var/www/diworkin-sites"
	defaultBackupRoot = "/var/backups/diworkin-panel"
	defaultSettingsAssetRoot = "/var/www/diworkin-panel/uploads/settings"
)

var fallbackMetrics = Metrics{
	CPU:      32,
	RAM:      58,
	Disk:     71,
	Hostname: "unknown",
	Source:   "demo",
}

type Metrics struct {
	CPU            int   `json:"cpu"`
	RAM            int   `json:"ram"`
	Disk           int   `json:"disk"`
	NetworkRxBytes int64 `json:"network_rx_bytes"`
	NetworkTxBytes int64 `json:"network_tx_bytes"`
	Hostname       string `json:"hostname"`
	UpdatedAt      string `json:"updated_at"`
	Source         string `json:"source"`
}

type overviewStatsResponse struct {
	ActiveDomains   int `json:"active_domains"`
	MailboxAccounts int `json:"mailbox_accounts"`
	QueuedMail      int `json:"queued_mail"`
	OpenSupportChats int `json:"open_support_chats"`
}

type backupItem struct {
	ID         string `json:"id"`
	OwnerEmail string `json:"owner_email,omitempty"`
	RuleID     string `json:"rule_id,omitempty"`
	Domain     string `json:"domain"`
	Scope      string `json:"scope"`
	Status     string `json:"status"`
	FileName   string `json:"file_name"`
	FilePath   string `json:"file_path,omitempty"`
	FileSize   int64  `json:"file_size"`
	Notes      string `json:"notes,omitempty"`
	CreatedBy  string `json:"created_by"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
	DownloadURL string `json:"download_url"`
}

type backupRequest struct {
	Domain string `json:"domain"`
	Scope  string `json:"scope"`
}

type backupRuleItem struct {
	ID             string `json:"id"`
	OwnerEmail     string `json:"owner_email,omitempty"`
	Domain         string `json:"domain"`
	Scope          string `json:"scope"`
	Frequency      string `json:"frequency"`
	Hour           int    `json:"hour"`
	Minute         int    `json:"minute"`
	RetentionCount  int    `json:"retention_count"`
	Enabled        bool   `json:"enabled"`
	CreatedBy      string `json:"created_by"`
	LastRunAt      string `json:"last_run_at,omitempty"`
	NextRunAt      string `json:"next_run_at,omitempty"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}

type backupRuleRequest struct {
	Domain        string `json:"domain"`
	Scope         string `json:"scope"`
	Frequency     string `json:"frequency"`
	Hour          int    `json:"hour"`
	Minute        int    `json:"minute"`
	RetentionCount int   `json:"retention_count"`
	Enabled       bool   `json:"enabled"`
}

type packageItem struct {
	ID                   int64  `json:"id"`
	Name                 string `json:"name"`
	Description          string `json:"description"`
	PriceRupiah          int64  `json:"price_rupiah"`
	BillingCycle         string `json:"billing_cycle"`
	DiskQuotaGB          int    `json:"disk_quota_gb"`
	EmailQuota           int    `json:"email_quota"`
	SubdomainQuota       int    `json:"subdomain_quota"`
	DatabaseQuota        int    `json:"database_quota"`
	DomainQuota          int    `json:"domain_quota"`
	FeatureSSL           bool   `json:"feature_ssl"`
	FeatureBackup        bool   `json:"feature_backup"`
	FeatureSSH           bool   `json:"feature_ssh"`
	FeatureFileManager   bool   `json:"feature_file_manager"`
	FeatureStudio        bool   `json:"feature_studio"`
	FeatureAutoInstaller bool   `json:"feature_auto_installer"`
	FeatureDNS           bool   `json:"feature_dns"`
	FeatureMail          bool   `json:"feature_mail"`
	FeaturePriority      bool   `json:"feature_priority_support"`
	Active               bool   `json:"active"`
	CreatedAt            string `json:"created_at"`
	UpdatedAt            string `json:"updated_at"`
}

type packageRequest struct {
	ID                   int64  `json:"id"`
	Name                 string `json:"name"`
	Description          string `json:"description"`
	PriceRupiah          int64  `json:"price_rupiah"`
	BillingCycle         string `json:"billing_cycle"`
	DiskQuotaGB          int    `json:"disk_quota_gb"`
	EmailQuota           int    `json:"email_quota"`
	SubdomainQuota       int    `json:"subdomain_quota"`
	DatabaseQuota        int    `json:"database_quota"`
	DomainQuota          int    `json:"domain_quota"`
	FeatureSSL           bool   `json:"feature_ssl"`
	FeatureBackup        bool   `json:"feature_backup"`
	FeatureSSH           bool   `json:"feature_ssh"`
	FeatureFileManager   bool   `json:"feature_file_manager"`
	FeatureStudio        bool   `json:"feature_studio"`
	FeatureAutoInstaller bool   `json:"feature_auto_installer"`
	FeatureDNS           bool   `json:"feature_dns"`
	FeatureMail          bool   `json:"feature_mail"`
	FeaturePriority      bool   `json:"feature_priority_support"`
	Active               bool   `json:"active"`
}

type licenseItem struct {
	ID              int64  `json:"id"`
	SourceBillingID  int64  `json:"source_billing_id,omitempty"`
	OwnerEmail      string `json:"owner_email"`
	OwnerName       string `json:"owner_name,omitempty"`
	Company         string `json:"company,omitempty"`
	ProductName     string `json:"product_name"`
	Domain          string `json:"domain"`
	LicenseKey      string `json:"license_key"`
	LicenseType     string `json:"license_type"`
	Status          string `json:"status"`
	ExpiresAt       string `json:"expires_at,omitempty"`
	ActivatedAt     string `json:"activated_at,omitempty"`
	Notes           string `json:"notes,omitempty"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type licenseRequest struct {
	ID          int64  `json:"id"`
	OwnerEmail  string `json:"owner_email"`
	ProductName string `json:"product_name"`
	Domain      string `json:"domain"`
	LicenseKey  string `json:"license_key"`
	LicenseType string `json:"license_type"`
	Status      string `json:"status"`
	ExpiresAt   string `json:"expires_at"`
	ActivatedAt string `json:"activated_at"`
	Notes       string `json:"notes"`
}

type licenseVerifyRequest struct {
	LicenseKey  string `json:"license_key"`
	Domain      string `json:"domain"`
	ProductName string `json:"product_name"`
	LicenseType string `json:"license_type"`
}

type licenseVerifyResponse struct {
	Valid   bool        `json:"valid"`
	Message string      `json:"message"`
	License licenseItem `json:"license"`
}

type billingItem struct {
	ID             int64  `json:"id"`
	InvoiceNumber   string `json:"invoice_number"`
	PackageID       int64  `json:"package_id"`
	PackageName     string `json:"package_name"`
	CustomerName    string `json:"customer_name"`
	CustomerEmail   string `json:"customer_email"`
	Domain          string `json:"domain"`
	BillingCycle    string `json:"billing_cycle"`
	AmountRupiah    int64  `json:"amount_rupiah"`
	Status          string `json:"status"`
	DueAt           string `json:"due_at,omitempty"`
	PeriodStartAt   string `json:"period_start_at,omitempty"`
	PeriodEndAt     string `json:"period_end_at,omitempty"`
	PaidAt          string `json:"paid_at,omitempty"`
	Notes           string `json:"notes,omitempty"`
	CreatedBy       string `json:"created_by"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type billingRequest struct {
	ID           int64  `json:"id"`
	InvoiceNumber string `json:"invoice_number"`
	PackageID     int64  `json:"package_id"`
	PackageName   string `json:"package_name"`
	CustomerName  string `json:"customer_name"`
	CustomerEmail string `json:"customer_email"`
	Domain        string `json:"domain"`
	BillingCycle  string `json:"billing_cycle"`
	AmountRupiah  int64  `json:"amount_rupiah"`
	Status        string `json:"status"`
	DueAt         string `json:"due_at"`
	PeriodStartAt  string `json:"period_start_at"`
	PeriodEndAt    string `json:"period_end_at"`
	PaidAt        string `json:"paid_at"`
	Notes         string `json:"notes"`
}

type affiliateItem struct {
	ID                     int64  `json:"id"`
	OwnerEmail             string `json:"owner_email"`
	OwnerName              string `json:"owner_name,omitempty"`
	Company                string `json:"company,omitempty"`
	ReferralCode           string `json:"referral_code"`
	CouponCode             string `json:"coupon_code"`
	CommissionPercent       int    `json:"commission_percent"`
	CouponDiscountPercent   int    `json:"coupon_discount_percent"`
	Active                 bool   `json:"active"`
	ReferredSignups        int    `json:"referred_signups"`
	TotalCommissionRupiah  int64  `json:"total_commission_rupiah"`
	ReferralURL            string `json:"referral_url,omitempty"`
	CreatedAt              string `json:"created_at"`
	UpdatedAt              string `json:"updated_at"`
}

type affiliateCommissionItem struct {
	ID                  int64  `json:"id"`
	AffiliateID         int64  `json:"affiliate_id"`
	OwnerEmail          string `json:"owner_email"`
	OwnerName           string `json:"owner_name,omitempty"`
	Company             string `json:"company,omitempty"`
	SourceEmail         string `json:"source_email"`
	SourceInvoiceNumber string `json:"source_invoice_number"`
	AmountRupiah        int64  `json:"amount_rupiah"`
	CommissionRupiah    int64  `json:"commission_rupiah"`
	Status              string `json:"status"`
	Notes               string `json:"notes"`
	CreatedAt           string `json:"created_at"`
	UpdatedAt           string `json:"updated_at"`
}

type affiliateRequest struct {
	ID                    int64  `json:"id"`
	OwnerEmail            string `json:"owner_email"`
	ReferralCode          string `json:"referral_code"`
	CouponCode            string `json:"coupon_code"`
	CommissionPercent     int    `json:"commission_percent"`
	CouponDiscountPercent int    `json:"coupon_discount_percent"`
	Active                bool   `json:"active"`
}

type affiliateCommissionRequest struct {
	AffiliateID         int64  `json:"affiliate_id"`
	OwnerEmail          string `json:"owner_email"`
	SourceEmail         string `json:"source_email"`
	SourceInvoiceNumber string `json:"source_invoice_number"`
	AmountRupiah        int64  `json:"amount_rupiah"`
	CommissionRupiah    int64  `json:"commission_rupiah"`
	Status              string `json:"status"`
	Notes               string `json:"notes"`
}

type settingsItem struct {
	ID               int64  `json:"id"`
	BrandName        string `json:"brand_name"`
	LogoURL          string `json:"logo_url"`
	LogoMarkURL      string `json:"logo_mark_url"`
	BusinessHours    string `json:"business_hours"`
	Location         string `json:"location"`
	OwnerName        string `json:"owner_name"`
	OwnerPhone       string `json:"owner_phone"`
	OwnerWhatsApp    string `json:"owner_whatsapp"`
	BankName         string `json:"bank_name"`
	BankAccountName  string `json:"bank_account_name"`
	BankAccountNumber string `json:"bank_account_number"`
	BankBranch       string `json:"bank_branch"`
	BankNote         string `json:"bank_note"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
}

type settingsRequest struct {
	BrandName        string `json:"brand_name"`
	LogoURL          string `json:"logo_url"`
	LogoMarkURL      string `json:"logo_mark_url"`
	BusinessHours    string `json:"business_hours"`
	Location         string `json:"location"`
	OwnerName        string `json:"owner_name"`
	OwnerPhone       string `json:"owner_phone"`
	OwnerWhatsApp    string `json:"owner_whatsapp"`
	BankName         string `json:"bank_name"`
	BankAccountName  string `json:"bank_account_name"`
	BankAccountNumber string `json:"bank_account_number"`
	BankBranch       string `json:"bank_branch"`
	BankNote         string `json:"bank_note"`
}

type User struct {
	Name            string `json:"name"`
	Company         string `json:"company,omitempty"`
	Email           string `json:"email"`
	Initials        string `json:"initials"`
	Approved        bool   `json:"approved"`
	IsAdmin         bool   `json:"is_admin"`
	EmailVerified   bool   `json:"email_verified"`
	Status          string `json:"status"`
	CreatedAt       string `json:"created_at,omitempty"`
	ApprovedAt     string `json:"approved_at,omitempty"`
	EmailVerifiedAt string `json:"email_verified_at,omitempty"`
}

type server struct {
	db               *sql.DB
	mailDB           *sql.DB
	sessionSecret    string
	cookieSecure     bool
	cookieDomain     string
	mailCookieDomain string
	panelBaseURL     string
	mailBaseURL      string
	publicIP         string
	sitesRoot        string
	backupRoot       string
	smtpHost         string
	smtpPort         string
	smtpUsername     string
	smtpPassword     string
	smtpFrom         string
}

type authRequest struct {
	Name         string `json:"name"`
	Company      string `json:"company"`
	Email        string `json:"email"`
	Password     string `json:"password"`
	ReferralCode  string `json:"referral_code"`
	CouponCode    string `json:"coupon_code"`
}

type authResponse struct {
	User    User   `json:"user"`
	Status  string `json:"status,omitempty"`
	Message string `json:"message,omitempty"`
}

type approveRequest struct {
	Email string `json:"email"`
}

type domainRequest struct {
	Domain      string `json:"domain"`
	ProjectName string `json:"project_name"`
}

type subdomainRequest struct {
	TargetKind  string `json:"target_kind"`
	Domain      string `json:"domain"`
	Subdomain   string `json:"subdomain"`
	ProjectName string `json:"project_name"`
	AppType     string `json:"app_type"`
}

type wordpressPasswordRequest struct {
	TargetKind string `json:"target_kind"`
	Domain     string `json:"domain"`
	Subdomain  string `json:"subdomain"`
	AppType    string `json:"app_type"`
	Password   string `json:"password"`
}

type installJobItem struct {
	ID           string `json:"id"`
	Kind         string `json:"kind"`
	Status       string `json:"status"`
	StepIndex    int    `json:"step_index"`
	StepTotal    int    `json:"step_total"`
	StepLabel    string `json:"step_label"`
	Message      string `json:"message"`
	Domain       string `json:"domain"`
	Subdomain    string `json:"subdomain"`
	FullDomain   string `json:"full_domain"`
	AppType      string `json:"app_type"`
	OwnerEmail   string `json:"owner_email"`
	ErrorMessage string `json:"error_message,omitempty"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
	CompletedAt  string `json:"completed_at,omitempty"`
}

type verifyEmailResponse struct {
	User    User   `json:"user"`
	Status  string `json:"status,omitempty"`
	Message string `json:"message,omitempty"`
}

type domainItem struct {
	Domain        string   `json:"domain"`
	ProjectName   string   `json:"project_name"`
	OwnerEmail    string   `json:"owner_email"`
	PublicPath    string   `json:"public_path"`
	AppType       string   `json:"app_type,omitempty"`
	WordPressAdminUser string `json:"wordpress_admin_user,omitempty"`
	WordPressAccessReady bool `json:"wordpress_access_ready,omitempty"`
	WordPressFilesystemMode string `json:"wordpress_filesystem_mode,omitempty"`
	ServerIP      string   `json:"server_ip"`
	DNSStatus     string   `json:"dns_status"`
	SiteStatus    string   `json:"site_status"`
	Nameservers   []string `json:"nameservers"`
	CreatedAt     string   `json:"created_at"`
	UpdatedAt     string   `json:"updated_at"`
	ProvisionedAt string   `json:"provisioned_at"`
}

type domainCheckResponse struct {
	Domain      string   `json:"domain"`
	DNSStatus   string   `json:"dns_status"`
	SiteStatus  string   `json:"site_status"`
	Nameservers []string `json:"nameservers"`
	ServerIP    string   `json:"server_ip"`
}

type subdomainItem struct {
	Domain      string `json:"domain"`
	Subdomain   string `json:"subdomain"`
	FullDomain  string `json:"full_domain"`
	ProjectName string `json:"project_name"`
	AppType     string `json:"app_type"`
	PublicPath  string `json:"public_path"`
	WordPressAdminUser string `json:"wordpress_admin_user,omitempty"`
	WordPressAccessReady bool `json:"wordpress_access_ready,omitempty"`
	WordPressFilesystemMode string `json:"wordpress_filesystem_mode,omitempty"`
	DatabaseName string `json:"database_name,omitempty"`
	DatabaseUsername string `json:"database_username,omitempty"`
	ConnectionURI string `json:"connection_uri,omitempty"`
	DNSStatus   string `json:"dns_status"`
	SiteStatus  string `json:"site_status"`
	OwnerEmail  string `json:"owner_email"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	ProvisionedAt string `json:"provisioned_at"`
}

type subdomainProvisionResult struct {
	WordPressAdminUser string
	WordPressAdminPass string
}

type sslTargetItem struct {
	Kind                string `json:"kind"`
	Domain              string `json:"domain"`
	Subdomain           string `json:"subdomain,omitempty"`
	FullDomain          string `json:"full_domain"`
	ProjectName         string `json:"project_name,omitempty"`
	AppType             string `json:"app_type,omitempty"`
	OwnerEmail          string `json:"owner_email"`
	PublicPath          string `json:"public_path,omitempty"`
	DNSStatus           string `json:"dns_status,omitempty"`
	SiteStatus          string `json:"site_status,omitempty"`
	CertificateStatus   string `json:"certificate_status"`
	CertificatePath     string `json:"certificate_path,omitempty"`
	CertificateExpiresAt string `json:"certificate_expires_at,omitempty"`
}

type sslIssueRequest struct {
	Kind      string `json:"kind"`
	Domain    string `json:"domain"`
	Subdomain string `json:"subdomain"`
}

type mailAccountItem struct {
	Email       string `json:"email"`
	Domain      string `json:"domain"`
	LocalPart   string `json:"local_part"`
	Enabled     bool   `json:"enabled"`
	MailboxPath string `json:"mailbox_path"`
	AccessReady bool   `json:"access_ready"`
}

type mailAccountRequest struct {
	Domain    string `json:"domain"`
	LocalPart string `json:"local_part"`
	Password  string `json:"password"`
	Enabled   *bool  `json:"enabled,omitempty"`
	Email     string `json:"email"`
}

type mailSessionRow struct {
	Email      string
	ExpiresAt  time.Time
	TokenHash  string
	LastSeenAt time.Time
}

type ftpAccountItem struct {
	ID          int64  `json:"id"`
	OwnerEmail  string `json:"owner_email"`
	SiteTarget  string `json:"site_target"`
	TargetKind  string `json:"target_kind"`
	BasePath    string `json:"base_path"`
	Username    string `json:"username"`
	PasswordReady bool `json:"password_ready"`
	Active      bool   `json:"active"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type ftpAccountRequest struct {
	ID         int64  `json:"id"`
	SiteTarget string `json:"site_target"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	Active     *bool  `json:"active,omitempty"`
}

type shellSessionItem struct {
	ID          int64  `json:"id"`
	OwnerEmail  string `json:"owner_email"`
	SiteTarget  string `json:"site_target"`
	TargetKind  string `json:"target_kind"`
	BasePath    string `json:"base_path"`
	Name        string `json:"name"`
	Active      bool   `json:"active"`
	LastCommand string `json:"last_command"`
	LastOutput  string `json:"last_output"`
	LastExitCode int  `json:"last_exit_code"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type shellSessionRequest struct {
	ID         int64  `json:"id"`
	SiteTarget string `json:"site_target"`
	Name       string `json:"name"`
	Active     *bool  `json:"active,omitempty"`
}

type shellExecuteRequest struct {
	SessionID int64  `json:"session_id"`
	Command   string `json:"command"`
}

type shellLogItem struct {
	ID        int64  `json:"id"`
	SessionID  int64  `json:"session_id"`
	Command   string `json:"command"`
	Output    string `json:"output"`
	ExitCode  int    `json:"exit_code"`
	CreatedAt string `json:"created_at"`
}

type dnsRecordItem struct {
	Domain  string `json:"domain"`
	Name    string `json:"name"`
	Type    string `json:"type"`
	TTL     int    `json:"ttl"`
	Content string `json:"content"`
	Prio    int    `json:"priority,omitempty"`
}

type dnsRecordRequest struct {
	Domain       string `json:"domain"`
	Name         string `json:"name"`
	Type         string `json:"type"`
	TTL          int    `json:"ttl"`
	Content      string `json:"content"`
	Priority     int    `json:"priority"`
	OriginalName string `json:"original_name"`
	OriginalType string `json:"original_type"`
}

type databaseItem struct {
	Domain         string `json:"domain"`
	Engine         string `json:"engine"`
	Name           string `json:"name"`
	Username       string `json:"username"`
	Host           string `json:"host"`
	Port           string `json:"port"`
	ConnectionURI  string `json:"connection_uri"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
	OwnerEmail     string `json:"owner_email,omitempty"`
}

type databaseRequest struct {
	Domain   string `json:"domain"`
	Engine   string `json:"engine"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type databaseEngineItem struct {
	Key       string `json:"key"`
	Label     string `json:"label"`
	Supported bool   `json:"supported"`
	Note      string `json:"note"`
}

type studioDatabaseItem struct {
	Domain    string `json:"domain"`
	Engine    string `json:"engine"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Host      string `json:"host"`
	Port      string `json:"port"`
	Status    string `json:"status"`
}

type studioObjectItem struct {
	Name          string   `json:"name"`
	Type          string   `json:"type"`
	PrimaryKey    []string `json:"primary_key,omitempty"`
	Columns       []string `json:"columns,omitempty"`
	EstimatedRows int64    `json:"estimated_rows,omitempty"`
}

type studioRowsResponse struct {
	Database   studioDatabaseItem `json:"database"`
	ObjectName string             `json:"object_name"`
	ObjectType string             `json:"object_type"`
	PrimaryKey []string           `json:"primary_key,omitempty"`
	Columns    []string           `json:"columns,omitempty"`
	Rows       []map[string]any   `json:"rows"`
}

type studioWriteRequest struct {
	Domain    string         `json:"domain"`
	Engine    string         `json:"engine"`
	Name      string         `json:"name"`
	Object    string         `json:"object"`
	KeyColumn string         `json:"key_column"`
	KeyValue  any            `json:"key_value"`
	Data      map[string]any `json:"data"`
}

type fileManagerItem struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	Type      string `json:"type"`
	Size      int64  `json:"size"`
	ModTime   string `json:"mod_time"`
	Extension string `json:"extension,omitempty"`
}

type fileManagerBrowseResponse struct {
	Domain     string           `json:"domain"`
	PublicPath string           `json:"public_path"`
	CurrentPath string          `json:"current_path"`
	ParentPath string           `json:"parent_path,omitempty"`
	Items      []fileManagerItem `json:"items"`
}

type fileManagerContentResponse struct {
	Domain     string `json:"domain"`
	Path       string `json:"path"`
	Content    string `json:"content"`
	Size       int64  `json:"size"`
	ModTime    string `json:"mod_time"`
	IsBinary   bool   `json:"is_binary"`
}

type fileManagerRequest struct {
	Domain  string `json:"domain"`
	Path    string `json:"path"`
	Kind    string `json:"kind"`
	Name    string `json:"name"`
	NewName string `json:"new_name"`
	Content string `json:"content"`
}

type sshKeyItem struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	PublicKey   string `json:"public_key"`
	Fingerprint string `json:"fingerprint"`
	Enabled     bool   `json:"enabled"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	OwnerEmail  string `json:"owner_email,omitempty"`
}

type sshStatusResponse struct {
	ServiceActive     bool   `json:"service_active"`
	ServiceName       string `json:"service_name"`
	Host              string `json:"host"`
	User              string `json:"user"`
	Port              string `json:"port"`
	AuthorizedKeys    string `json:"authorized_keys_path"`
	ManagedKeys       int    `json:"managed_keys"`
}

type sshKeyRequest struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	PublicKey string `json:"public_key"`
	Enabled   *bool  `json:"enabled,omitempty"`
}

type sessionRow struct {
	Email      string
	ExpiresAt  time.Time
	TokenHash  string
	LastSeenAt time.Time
}

type mailAuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type mailFolderSummary struct {
	Name        string `json:"name"`
	Label       string `json:"label"`
	Count       int    `json:"count"`
	UnreadCount int    `json:"unread_count"`
}

type mailAccountSummary struct {
	Email      string `json:"email"`
	DisplayName string `json:"display_name,omitempty"`
	LocalPart  string `json:"local_part"`
	Domain     string `json:"domain"`
	Maildir    string `json:"maildir"`
	Enabled    bool   `json:"enabled"`
}

type mailAttachmentSummary struct {
	Name        string `json:"name"`
	ContentType string `json:"content_type"`
	Size        int64  `json:"size"`
}

type mailMessageSummary struct {
	ID             string `json:"id"`
	MessageID      string `json:"message_id,omitempty"`
	Folder         string `json:"folder"`
	From           string `json:"from"`
	Subject        string `json:"subject"`
	Preview        string `json:"preview"`
	Time           string `json:"time"`
	Timestamp      string `json:"timestamp"`
	Size           int64  `json:"size"`
	Unread         bool   `json:"unread"`
	HasAttachments bool   `json:"has_attachments"`
}

type mailMessageDetail struct {
	ID          string                `json:"id"`
	MessageID   string                `json:"message_id,omitempty"`
	Folder      string                `json:"folder"`
	From        string                `json:"from"`
	To          string                `json:"to,omitempty"`
	Cc          string                `json:"cc,omitempty"`
	Subject     string                `json:"subject"`
	Preview     string                `json:"preview"`
	Time        string                `json:"time"`
	Timestamp   string                `json:"timestamp"`
	Size        int64                 `json:"size"`
	Unread      bool                  `json:"unread"`
	HTML        string                `json:"html,omitempty"`
	Text        string                `json:"text,omitempty"`
	Attachments []mailAttachmentSummary `json:"attachments"`
}

type mailInboxResponse struct {
	Account mailAccountSummary   `json:"account"`
	Folders []mailFolderSummary  `json:"folders"`
	Messages []mailMessageSummary `json:"messages"`
	Selected *mailMessageDetail  `json:"selected,omitempty"`
}

type mailSendRequest struct {
	To      string   `json:"to"`
	Cc      string   `json:"cc"`
	Bcc     string   `json:"bcc"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
}

type mailArchiveRequest struct {
	ID     string `json:"id"`
	Action string `json:"action"`
}

func main() {
	addr := envOr("DIWORKIN_PANEL_ADDR", defaultPort)
	dsn := envOr("DIWORKIN_PANEL_DSN", "")
	if dsn == "" {
		log.Fatal("DIWORKIN_PANEL_DSN is required")
	}

	sessionSecret := envOr("DIWORKIN_SESSION_SECRET", "")
	if sessionSecret == "" {
		log.Fatal("DIWORKIN_SESSION_SECRET is required")
	}

	cookieSecure := envBool("DIWORKIN_COOKIE_SECURE", true)
	cookieDomain := envOr("DIWORKIN_COOKIE_DOMAIN", ".diworkin.com")
	panelBaseURL := envOr("DIWORKIN_PANEL_PUBLIC_URL", "https://panel.diworkin.com")
	mailCookieDomain := envOr("DIWORKIN_MAIL_COOKIE_DOMAIN", ".diworkin.com")
	mailBaseURL := envOr("DIWORKIN_MAIL_PUBLIC_URL", "https://email.diworkin.com")
	publicIP := envOr("DIWORKIN_PUBLIC_IP", "")
	sitesRoot := envOr("DIWORKIN_SITES_ROOT", defaultSitesRoot)
	mailDSN := envOr("DIWORKIN_MAIL_DSN", "")
	smtpHost := envOr("DIWORKIN_SMTP_HOST", "127.0.0.1")
	smtpPort := envOr("DIWORKIN_SMTP_PORT", "25")
	smtpUsername := envOr("DIWORKIN_SMTP_USERNAME", "")
	smtpPassword := envOr("DIWORKIN_SMTP_PASSWORD", "")
	smtpFrom := envOr("DIWORKIN_SMTP_FROM", "Diworkin Panel <no-reply@diworkin.com>")

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if mailDSN == "" {
		log.Fatal("DIWORKIN_MAIL_DSN is required")
	}

	mailDB, err := sql.Open("pgx", mailDSN)
	if err != nil {
		log.Fatal(err)
	}
	defer mailDB.Close()

	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetMaxOpenConns(8)
	db.SetMaxIdleConns(4)
	mailDB.SetConnMaxLifetime(5 * time.Minute)
	mailDB.SetMaxOpenConns(8)
	mailDB.SetMaxIdleConns(4)

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	if err := mailDB.Ping(); err != nil {
		log.Fatal(err)
	}
	if err := ensureMailSchema(mailDB); err != nil {
		log.Fatal(err)
	}

	srv := &server{
		db:               db,
		mailDB:           mailDB,
		sessionSecret:    sessionSecret,
		cookieSecure:     cookieSecure,
		cookieDomain:     strings.TrimSpace(cookieDomain),
		mailCookieDomain: strings.TrimSpace(mailCookieDomain),
		panelBaseURL:     strings.TrimRight(panelBaseURL, "/"),
		mailBaseURL:      strings.TrimRight(mailBaseURL, "/"),
		publicIP:         strings.TrimSpace(publicIP),
		sitesRoot:        strings.TrimSpace(sitesRoot),
		backupRoot:       envOr("DIWORKIN_BACKUP_ROOT", defaultBackupRoot),
		smtpHost:         smtpHost,
		smtpPort:         smtpPort,
		smtpUsername:     smtpUsername,
		smtpPassword:     smtpPassword,
		smtpFrom:         smtpFrom,
	}

	if err := srv.initSchema(); err != nil {
		log.Fatal(err)
	}
	if err := srv.ensureSupportChatSchema(); err != nil {
		log.Fatal(err)
	}

	if err := srv.seedBootstrapUser(); err != nil {
		log.Fatal(err)
	}

	if err := srv.syncSSHAuthorizedKeys(); err != nil {
		log.Printf("warning: failed to sync SSH authorized_keys: %v", err)
	}

	go srv.runBackupScheduler()

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", srv.healthz)
	mux.HandleFunc("/api/metrics", srv.withAuth(srv.metrics))
	mux.HandleFunc("/api/overview", srv.withAuth(srv.overview))
	mux.HandleFunc("/api/auth/me", srv.withAuth(srv.me))
	mux.HandleFunc("/api/auth/login", srv.login)
	mux.HandleFunc("/api/auth/register", srv.register)
	mux.HandleFunc("/api/auth/verify-email", srv.verifyEmail)
	mux.HandleFunc("/api/auth/logout", srv.withAuth(srv.logout))
	mux.HandleFunc("/api/admin/users", srv.withAdminAuth(srv.adminUsers))
	mux.HandleFunc("/api/admin/users/approve", srv.withAdminAuth(srv.approveUser))
	mux.HandleFunc("/api/packages", srv.withAdminAuth(srv.packages))
	mux.HandleFunc("/api/licenses", srv.withAdminAuth(srv.licenses))
	mux.HandleFunc("/api/licenses/verify", srv.withPublicCORS(srv.verifyLicense))
	mux.HandleFunc("/api/billing", srv.withAdminAuth(srv.billing))
	mux.HandleFunc("/api/affiliates", srv.withAuth(srv.affiliates))
	mux.HandleFunc("/api/affiliates/commissions", srv.withAuth(srv.affiliateCommissions))
	mux.HandleFunc("/api/settings", srv.withAuth(srv.settings))
	mux.HandleFunc("/api/settings/upload", srv.withAuth(srv.settingsUpload))
	mux.HandleFunc("/api/domains", srv.withAuth(srv.domains))
	mux.HandleFunc("/api/domains/check", srv.withAuth(srv.domainCheck))
	mux.HandleFunc("/api/domains/update", srv.withAuth(srv.updateDomain))
	mux.HandleFunc("/api/domains/delete", srv.withAuth(srv.deleteDomain))
	mux.HandleFunc("/api/sites", srv.withAuth(srv.sites))
	mux.HandleFunc("/api/sites/wordpress-repair", srv.withAuth(srv.wordpressRepair))
	mux.HandleFunc("/api/sites/wordpress-password", srv.withAuth(srv.wordpressPassword))
	mux.HandleFunc("/api/subdomains", srv.withAuth(srv.subdomains))
	mux.HandleFunc("/api/subdomain-jobs", srv.withAuth(srv.subdomainJobs))
	mux.HandleFunc("/api/subdomain-jobs/cancel", srv.withAuth(srv.cancelSubdomainJob))
	mux.HandleFunc("/api/databases", srv.withAuth(srv.databases))
	mux.HandleFunc("/api/databases/engines", srv.withAuth(srv.databaseEngines))
	mux.HandleFunc("/api/studio/databases", srv.withAuth(srv.studioDatabases))
	mux.HandleFunc("/api/studio/objects", srv.withAuth(srv.studioObjects))
	mux.HandleFunc("/api/studio/rows", srv.withAuth(srv.studioRows))
	mux.HandleFunc("/api/ftp/accounts", srv.withAuth(srv.ftpAccounts))
	mux.HandleFunc("/api/shell/sessions", srv.withAuth(srv.shellSessions))
	mux.HandleFunc("/api/shell/execute", srv.withAuth(srv.shellExecute))
	mux.HandleFunc("/api/shell/logs", srv.withAuth(srv.shellLogs))
	mux.HandleFunc("/api/files", srv.withAuth(srv.fileManager))
	mux.HandleFunc("/api/ssh/status", srv.withAdminAuth(srv.sshStatus))
	mux.HandleFunc("/api/ssh/keys", srv.withAdminAuth(srv.sshKeys))
	mux.HandleFunc("/api/ssh/keys/delete", srv.withAdminAuth(srv.deleteSSHKey))
	mux.HandleFunc("/api/dns/domains", srv.withAuth(srv.dnsDomains))
	mux.HandleFunc("/api/dns/records", srv.withAuth(srv.dnsRecords))
	mux.HandleFunc("/api/ssl/targets", srv.withAuth(srv.sslTargets))
	mux.HandleFunc("/api/ssl/issue", srv.withAuth(srv.sslIssue))
	mux.HandleFunc("/api/email/login", srv.emailLogin)
	mux.HandleFunc("/api/email/open", srv.emailOpen)
	mux.HandleFunc("/api/email/sso", srv.emailSSO)
	mux.HandleFunc("/api/email/logout", srv.withMailAuth(srv.emailLogout))
	mux.HandleFunc("/api/email/me", srv.withMailAuth(srv.emailMe))
	mux.HandleFunc("/api/email/inbox", srv.withMailAuth(srv.emailInbox))
	mux.HandleFunc("/api/email/message", srv.withMailAuth(srv.emailMessage))
	mux.HandleFunc("/api/email/send", srv.withMailAuth(srv.emailSend))
	mux.HandleFunc("/api/email/draft", srv.withMailAuth(srv.emailDraft))
	mux.HandleFunc("/api/email/archive", srv.withMailAuth(srv.emailArchive))
	mux.HandleFunc("/api/mail/domains", srv.withAuth(srv.mailDomains))
	mux.HandleFunc("/api/mail/accounts", srv.withAuth(srv.mailAccounts))
	mux.HandleFunc("/api/mail/open", srv.withAuth(srv.mailAccess))
	mux.HandleFunc("/api/mail/access", srv.withAuth(srv.mailAccess))
	mux.HandleFunc("/api/backups", srv.withAuth(srv.backups))
	mux.HandleFunc("/api/backup-rules", srv.withAuth(srv.backupRules))
	mux.HandleFunc("/api/backups/download", srv.withAuth(srv.backupDownload))
	mux.HandleFunc("/api/support/public/start", srv.withSupportPublicCORS(srv.supportPublicStart))
	mux.HandleFunc("/api/support/public/thread", srv.withSupportPublicCORS(srv.supportPublicThread))
	mux.HandleFunc("/api/support/public/message", srv.withSupportPublicCORS(srv.supportPublicMessage))
	mux.HandleFunc("/api/support/public/close", srv.withSupportPublicCORS(srv.supportPublicClose))
	mux.HandleFunc("/api/support/inbox", srv.withAdminAuth(srv.supportAdminInbox))
	mux.HandleFunc("/api/support/thread", srv.withAdminAuth(srv.supportAdminThread))

	log.Printf("panel api listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func (s *server) initSchema() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS panel_users (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			company TEXT NOT NULL DEFAULT '',
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			referrer_affiliate_id BIGINT,
			affiliate_coupon_code TEXT NOT NULL DEFAULT '',
			email_verified BOOLEAN NOT NULL DEFAULT FALSE,
			email_verified_at TIMESTAMPTZ,
			approved BOOLEAN NOT NULL DEFAULT FALSE,
			is_admin BOOLEAN NOT NULL DEFAULT FALSE,
			approved_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_email_verification_tokens (
			token_hash TEXT PRIMARY KEY,
			email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			expires_at TIMESTAMPTZ NOT NULL,
			consumed_at TIMESTAMPTZ
		)`,
		`CREATE TABLE IF NOT EXISTS panel_sessions (
			token_hash TEXT PRIMARY KEY,
			email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			expires_at TIMESTAMPTZ NOT NULL,
			last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_domains (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL UNIQUE,
			project_name TEXT NOT NULL DEFAULT '',
			app_type TEXT NOT NULL DEFAULT 'plain',
			wordpress_admin_user TEXT NOT NULL DEFAULT '',
			wordpress_admin_pass_enc TEXT NOT NULL DEFAULT '',
			public_path TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_subdomains (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL REFERENCES panel_domains(domain) ON DELETE CASCADE,
			subdomain TEXT NOT NULL,
			full_domain TEXT NOT NULL UNIQUE,
			project_name TEXT NOT NULL DEFAULT '',
			app_type TEXT NOT NULL DEFAULT 'plain',
			public_path TEXT NOT NULL,
			database_name TEXT NOT NULL DEFAULT '',
			database_username TEXT NOT NULL DEFAULT '',
			connection_uri TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_install_jobs (
			id TEXT PRIMARY KEY,
			kind TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'queued',
			step_index INT NOT NULL DEFAULT 0,
			step_total INT NOT NULL DEFAULT 0,
			step_label TEXT NOT NULL DEFAULT '',
			message TEXT NOT NULL DEFAULT '',
			domain TEXT NOT NULL DEFAULT '',
			subdomain TEXT NOT NULL DEFAULT '',
			full_domain TEXT NOT NULL DEFAULT '',
			app_type TEXT NOT NULL DEFAULT 'plain',
			owner_email TEXT NOT NULL DEFAULT '',
			error_message TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			completed_at TIMESTAMPTZ
		)`,
		`CREATE TABLE IF NOT EXISTS panel_databases (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL,
			engine TEXT NOT NULL,
			name TEXT NOT NULL,
			username TEXT NOT NULL,
			connection_uri TEXT NOT NULL,
			host TEXT NOT NULL,
			port TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (engine, name)
		)`,
		`CREATE INDEX IF NOT EXISTS panel_sessions_email_idx ON panel_sessions (email)`,
		`CREATE INDEX IF NOT EXISTS panel_sessions_expires_at_idx ON panel_sessions (expires_at)`,
		`CREATE INDEX IF NOT EXISTS panel_domains_owner_email_idx ON panel_domains (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_subdomains_owner_email_idx ON panel_subdomains (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_subdomains_domain_idx ON panel_subdomains (domain)`,
		`CREATE INDEX IF NOT EXISTS panel_databases_owner_email_idx ON panel_databases (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_databases_domain_idx ON panel_databases (domain)`,
		`CREATE TABLE IF NOT EXISTS panel_ftp_accounts (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			site_target TEXT NOT NULL,
			target_kind TEXT NOT NULL DEFAULT 'domain',
			base_path TEXT NOT NULL DEFAULT '',
			username TEXT NOT NULL,
			password_enc TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_ftp_accounts_owner_email_idx ON panel_ftp_accounts (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_ftp_accounts_site_target_idx ON panel_ftp_accounts (site_target)`,
		`CREATE TABLE IF NOT EXISTS panel_shell_sessions (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			site_target TEXT NOT NULL,
			target_kind TEXT NOT NULL DEFAULT 'domain',
			base_path TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT TRUE,
			last_command TEXT NOT NULL DEFAULT '',
			last_output TEXT NOT NULL DEFAULT '',
			last_exit_code INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_shell_sessions_owner_email_idx ON panel_shell_sessions (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_shell_sessions_site_target_idx ON panel_shell_sessions (site_target)`,
		`CREATE TABLE IF NOT EXISTS panel_shell_logs (
			id BIGSERIAL PRIMARY KEY,
			session_id BIGINT NOT NULL REFERENCES panel_shell_sessions(id) ON DELETE CASCADE,
			command TEXT NOT NULL DEFAULT '',
			output TEXT NOT NULL DEFAULT '',
			exit_code INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_shell_logs_session_id_idx ON panel_shell_logs (session_id)`,
		`CREATE TABLE IF NOT EXISTS panel_packages (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			description TEXT NOT NULL DEFAULT '',
			price_rupiah BIGINT NOT NULL DEFAULT 0,
			billing_cycle TEXT NOT NULL DEFAULT 'monthly',
			disk_quota_gb INTEGER NOT NULL DEFAULT 0,
			email_quota INTEGER NOT NULL DEFAULT 0,
			subdomain_quota INTEGER NOT NULL DEFAULT 0,
			database_quota INTEGER NOT NULL DEFAULT 0,
			domain_quota INTEGER NOT NULL DEFAULT 0,
			feature_ssl BOOLEAN NOT NULL DEFAULT TRUE,
			feature_backup BOOLEAN NOT NULL DEFAULT FALSE,
			feature_ssh BOOLEAN NOT NULL DEFAULT FALSE,
			feature_file_manager BOOLEAN NOT NULL DEFAULT TRUE,
			feature_studio BOOLEAN NOT NULL DEFAULT FALSE,
			feature_auto_installer BOOLEAN NOT NULL DEFAULT FALSE,
			feature_dns BOOLEAN NOT NULL DEFAULT TRUE,
			feature_mail BOOLEAN NOT NULL DEFAULT TRUE,
			feature_priority_support BOOLEAN NOT NULL DEFAULT FALSE,
			active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_packages_active_idx ON panel_packages (active)`,
		`CREATE INDEX IF NOT EXISTS panel_packages_created_at_idx ON panel_packages (created_at)`,
		`CREATE TABLE IF NOT EXISTS panel_licenses (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			source_billing_id BIGINT NULL UNIQUE,
			product_name TEXT NOT NULL DEFAULT '',
			domain TEXT NOT NULL DEFAULT '',
			license_key TEXT NOT NULL UNIQUE,
			license_type TEXT NOT NULL DEFAULT 'panel',
			status TEXT NOT NULL DEFAULT 'active',
			expires_at TIMESTAMPTZ NULL,
			activated_at TIMESTAMPTZ NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_licenses ADD COLUMN IF NOT EXISTS source_billing_id BIGINT`,
		`CREATE UNIQUE INDEX IF NOT EXISTS panel_licenses_source_billing_id_key ON panel_licenses (source_billing_id)`,
		`CREATE INDEX IF NOT EXISTS panel_licenses_owner_email_idx ON panel_licenses (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_licenses_source_billing_id_idx ON panel_licenses (source_billing_id)`,
		`CREATE INDEX IF NOT EXISTS panel_licenses_license_key_idx ON panel_licenses (license_key)`,
		`CREATE INDEX IF NOT EXISTS panel_licenses_status_idx ON panel_licenses (status)`,
		`CREATE INDEX IF NOT EXISTS panel_licenses_expires_at_idx ON panel_licenses (expires_at)`,
		`CREATE TABLE IF NOT EXISTS panel_settings (
			id BIGSERIAL PRIMARY KEY,
			brand_name TEXT NOT NULL DEFAULT 'Diworkin',
			logo_url TEXT NOT NULL DEFAULT '',
			logo_mark_url TEXT NOT NULL DEFAULT '',
			business_hours TEXT NOT NULL DEFAULT '',
			location TEXT NOT NULL DEFAULT '',
			owner_name TEXT NOT NULL DEFAULT '',
			owner_phone TEXT NOT NULL DEFAULT '',
			owner_whatsapp TEXT NOT NULL DEFAULT '',
			bank_name TEXT NOT NULL DEFAULT '',
			bank_account_name TEXT NOT NULL DEFAULT '',
			bank_account_number TEXT NOT NULL DEFAULT '',
			bank_branch TEXT NOT NULL DEFAULT '',
			bank_note TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_mail_access_cache (
			email TEXT PRIMARY KEY REFERENCES panel_users(email) ON DELETE CASCADE,
			password_enc TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS panel_billing_records (
			id BIGSERIAL PRIMARY KEY,
			invoice_number TEXT NOT NULL UNIQUE,
			package_id BIGINT NULL REFERENCES panel_packages(id) ON DELETE SET NULL,
			package_name TEXT NOT NULL DEFAULT '',
			customer_name TEXT NOT NULL DEFAULT '',
			customer_email TEXT NOT NULL DEFAULT '',
			domain TEXT NOT NULL DEFAULT '',
			billing_cycle TEXT NOT NULL DEFAULT 'monthly',
			amount_rupiah BIGINT NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'pending',
			due_at TIMESTAMPTZ NULL,
			period_start_at TIMESTAMPTZ NULL,
			period_end_at TIMESTAMPTZ NULL,
			paid_at TIMESTAMPTZ NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_by TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_package_id_idx ON panel_billing_records (package_id)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_customer_email_idx ON panel_billing_records (customer_email)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_status_idx ON panel_billing_records (status)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_due_at_idx ON panel_billing_records (due_at)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_created_at_idx ON panel_billing_records (created_at)`,
		`CREATE TABLE IF NOT EXISTS panel_affiliates (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL UNIQUE REFERENCES panel_users(email) ON DELETE CASCADE,
			referral_code TEXT NOT NULL UNIQUE,
			coupon_code TEXT NOT NULL UNIQUE,
			commission_percent INTEGER NOT NULL DEFAULT 10,
			coupon_discount_percent INTEGER NOT NULL DEFAULT 0,
			active BOOLEAN NOT NULL DEFAULT TRUE,
			referred_signups INTEGER NOT NULL DEFAULT 0,
			total_commission_rupiah BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliates_owner_email_idx ON panel_affiliates (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliates_referral_code_idx ON panel_affiliates (referral_code)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliates_coupon_code_idx ON panel_affiliates (coupon_code)`,
		`CREATE TABLE IF NOT EXISTS panel_affiliate_commissions (
			id BIGSERIAL PRIMARY KEY,
			affiliate_id BIGINT NOT NULL REFERENCES panel_affiliates(id) ON DELETE CASCADE,
			source_email TEXT NOT NULL DEFAULT '',
			source_invoice_number TEXT NOT NULL DEFAULT '',
			amount_rupiah BIGINT NOT NULL DEFAULT 0,
			commission_rupiah BIGINT NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'pending',
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliate_commissions_affiliate_id_idx ON panel_affiliate_commissions (affiliate_id)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliate_commissions_status_idx ON panel_affiliate_commissions (status)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliate_commissions_created_at_idx ON panel_affiliate_commissions (created_at)`,
		`CREATE TABLE IF NOT EXISTS panel_backups (
			id TEXT PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			rule_id TEXT NOT NULL DEFAULT '',
			domain TEXT NOT NULL,
			scope TEXT NOT NULL DEFAULT 'site',
			status TEXT NOT NULL DEFAULT 'ready',
			file_name TEXT NOT NULL DEFAULT '',
			file_path TEXT NOT NULL DEFAULT '',
			file_size BIGINT NOT NULL DEFAULT 0,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			created_by TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE INDEX IF NOT EXISTS panel_backups_owner_email_idx ON panel_backups (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_backups_domain_idx ON panel_backups (domain)`,
		`CREATE TABLE IF NOT EXISTS panel_backup_rules (
			id TEXT PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL,
			scope TEXT NOT NULL DEFAULT 'site',
			frequency TEXT NOT NULL DEFAULT 'daily',
			hour INTEGER NOT NULL DEFAULT 2,
			minute INTEGER NOT NULL DEFAULT 0,
			retention_count INTEGER NOT NULL DEFAULT 7,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_by TEXT NOT NULL DEFAULT '',
			last_run_at TIMESTAMPTZ NULL,
			next_run_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_backup_rules_owner_email_idx ON panel_backup_rules (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_backup_rules_domain_idx ON panel_backup_rules (domain)`,
		`CREATE INDEX IF NOT EXISTS panel_backup_rules_next_run_idx ON panel_backup_rules (next_run_at)`,
		`CREATE TABLE IF NOT EXISTS panel_ssh_keys (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			title TEXT NOT NULL DEFAULT '',
			public_key TEXT NOT NULL UNIQUE,
			fingerprint TEXT NOT NULL DEFAULT '',
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_ssh_keys_owner_email_idx ON panel_ssh_keys (owner_email)`,
	}

	for _, stmt := range stmts {
		if _, err := s.db.Exec(stmt); err != nil {
			return err
		}
	}

	migrations := []string{
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`,
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS referrer_affiliate_id BIGINT`,
		`ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS affiliate_coupon_code TEXT NOT NULL DEFAULT ''`,
		`CREATE TABLE IF NOT EXISTS panel_domains (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL UNIQUE,
			project_name TEXT NOT NULL DEFAULT '',
			public_path TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS project_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS app_type TEXT NOT NULL DEFAULT 'plain'`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS wordpress_admin_user TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS wordpress_admin_pass_enc TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS public_path TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_domains ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_domains_owner_email_idx ON panel_domains (owner_email)`,
		`CREATE TABLE IF NOT EXISTS panel_subdomains (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL REFERENCES panel_domains(domain) ON DELETE CASCADE,
			subdomain TEXT NOT NULL,
			full_domain TEXT NOT NULL UNIQUE,
			project_name TEXT NOT NULL DEFAULT '',
			app_type TEXT NOT NULL DEFAULT 'plain',
			wordpress_admin_user TEXT NOT NULL DEFAULT '',
			wordpress_admin_pass_enc TEXT NOT NULL DEFAULT '',
			public_path TEXT NOT NULL,
			database_name TEXT NOT NULL DEFAULT '',
			database_username TEXT NOT NULL DEFAULT '',
			connection_uri TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS subdomain TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS full_domain TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS project_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS app_type TEXT NOT NULL DEFAULT 'plain'`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS wordpress_admin_user TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS wordpress_admin_pass_enc TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS public_path TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS database_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS database_username TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS connection_uri TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_subdomains ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_subdomains_owner_email_idx ON panel_subdomains (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_subdomains_domain_idx ON panel_subdomains (domain)`,
		`CREATE TABLE IF NOT EXISTS panel_packages (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			description TEXT NOT NULL DEFAULT '',
			price_rupiah BIGINT NOT NULL DEFAULT 0,
			billing_cycle TEXT NOT NULL DEFAULT 'monthly',
			disk_quota_gb INTEGER NOT NULL DEFAULT 0,
			email_quota INTEGER NOT NULL DEFAULT 0,
			subdomain_quota INTEGER NOT NULL DEFAULT 0,
			database_quota INTEGER NOT NULL DEFAULT 0,
			domain_quota INTEGER NOT NULL DEFAULT 0,
			feature_ssl BOOLEAN NOT NULL DEFAULT TRUE,
			feature_backup BOOLEAN NOT NULL DEFAULT FALSE,
			feature_ssh BOOLEAN NOT NULL DEFAULT FALSE,
			feature_file_manager BOOLEAN NOT NULL DEFAULT TRUE,
			feature_studio BOOLEAN NOT NULL DEFAULT FALSE,
			feature_auto_installer BOOLEAN NOT NULL DEFAULT FALSE,
			feature_dns BOOLEAN NOT NULL DEFAULT TRUE,
			feature_mail BOOLEAN NOT NULL DEFAULT TRUE,
			feature_priority_support BOOLEAN NOT NULL DEFAULT FALSE,
			active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS price_rupiah BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS disk_quota_gb INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS email_quota INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS subdomain_quota INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS database_quota INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS domain_quota INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_ssl BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_backup BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_ssh BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_file_manager BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_studio BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_auto_installer BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_dns BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_mail BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS feature_priority_support BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_packages_active_idx ON panel_packages (active)`,
		`CREATE INDEX IF NOT EXISTS panel_packages_created_at_idx ON panel_packages (created_at)`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS brand_name TEXT NOT NULL DEFAULT 'Diworkin'`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS logo_mark_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS business_hours TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS owner_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS owner_phone TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS owner_whatsapp TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS bank_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS bank_account_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS bank_branch TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS bank_note TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE TABLE IF NOT EXISTS panel_billing_records (
			id BIGSERIAL PRIMARY KEY,
			invoice_number TEXT NOT NULL UNIQUE,
			package_id BIGINT NULL REFERENCES panel_packages(id) ON DELETE SET NULL,
			package_name TEXT NOT NULL DEFAULT '',
			customer_name TEXT NOT NULL DEFAULT '',
			customer_email TEXT NOT NULL DEFAULT '',
			domain TEXT NOT NULL DEFAULT '',
			billing_cycle TEXT NOT NULL DEFAULT 'monthly',
			amount_rupiah BIGINT NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'pending',
			due_at TIMESTAMPTZ NULL,
			period_start_at TIMESTAMPTZ NULL,
			period_end_at TIMESTAMPTZ NULL,
			paid_at TIMESTAMPTZ NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_by TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS invoice_number TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS package_id BIGINT`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS package_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS customer_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS amount_rupiah BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS period_start_at TIMESTAMPTZ`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS period_end_at TIMESTAMPTZ`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_billing_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_package_id_idx ON panel_billing_records (package_id)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_customer_email_idx ON panel_billing_records (customer_email)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_status_idx ON panel_billing_records (status)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_due_at_idx ON panel_billing_records (due_at)`,
		`CREATE INDEX IF NOT EXISTS panel_billing_records_created_at_idx ON panel_billing_records (created_at)`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS referral_code TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS coupon_code TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS commission_percent INTEGER NOT NULL DEFAULT 10`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS coupon_discount_percent INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS referred_signups INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS total_commission_rupiah BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_affiliates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_affiliates_owner_email_idx ON panel_affiliates (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliates_referral_code_idx ON panel_affiliates (referral_code)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliates_coupon_code_idx ON panel_affiliates (coupon_code)`,
		`CREATE TABLE IF NOT EXISTS panel_affiliate_commissions (
			id BIGSERIAL PRIMARY KEY,
			affiliate_id BIGINT NOT NULL REFERENCES panel_affiliates(id) ON DELETE CASCADE,
			source_email TEXT NOT NULL DEFAULT '',
			source_invoice_number TEXT NOT NULL DEFAULT '',
			amount_rupiah BIGINT NOT NULL DEFAULT 0,
			commission_rupiah BIGINT NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'pending',
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS affiliate_id BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS source_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS source_invoice_number TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS amount_rupiah BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS commission_rupiah BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_affiliate_commissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_affiliate_commissions_affiliate_id_idx ON panel_affiliate_commissions (affiliate_id)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliate_commissions_status_idx ON panel_affiliate_commissions (status)`,
		`CREATE INDEX IF NOT EXISTS panel_affiliate_commissions_created_at_idx ON panel_affiliate_commissions (created_at)`,
		`INSERT INTO panel_settings (
			brand_name, logo_url, logo_mark_url, business_hours, location,
			owner_name, owner_phone, owner_whatsapp,
			bank_name, bank_account_name, bank_account_number, bank_branch, bank_note
		)
		SELECT
			'Diworkin', '/diworkin-logo.png', '/diworkin-mark-dark.png', 'Senin - Jumat, 09:00 - 17:00', '',
			'Diworkin', '', '',
			'', '', '', '', ''
		WHERE NOT EXISTS (SELECT 1 FROM panel_settings)`,
		`CREATE TABLE IF NOT EXISTS panel_backups (
			id TEXT PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL,
			scope TEXT NOT NULL DEFAULT 'site',
			status TEXT NOT NULL DEFAULT 'ready',
			file_name TEXT NOT NULL DEFAULT '',
			file_path TEXT NOT NULL DEFAULT '',
			file_size BIGINT NOT NULL DEFAULT 0,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			created_by TEXT NOT NULL DEFAULT ''
		)`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS rule_id TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'site'`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready'`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS file_path TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS file_size BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_backups ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT ''`,
		`CREATE INDEX IF NOT EXISTS panel_backups_owner_email_idx ON panel_backups (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_backups_domain_idx ON panel_backups (domain)`,
		`CREATE INDEX IF NOT EXISTS panel_backups_rule_id_idx ON panel_backups (rule_id)`,
		`CREATE TABLE IF NOT EXISTS panel_backup_rules (
			id TEXT PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL,
			scope TEXT NOT NULL DEFAULT 'site',
			frequency TEXT NOT NULL DEFAULT 'daily',
			hour INTEGER NOT NULL DEFAULT 2,
			minute INTEGER NOT NULL DEFAULT 0,
			retention_count INTEGER NOT NULL DEFAULT 7,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_by TEXT NOT NULL DEFAULT '',
			last_run_at TIMESTAMPTZ NULL,
			next_run_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS panel_backup_rules_owner_email_idx ON panel_backup_rules (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_backup_rules_domain_idx ON panel_backup_rules (domain)`,
		`CREATE INDEX IF NOT EXISTS panel_backup_rules_next_run_idx ON panel_backup_rules (next_run_at)`,
		`CREATE TABLE IF NOT EXISTS panel_ssh_keys (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			title TEXT NOT NULL DEFAULT '',
			public_key TEXT NOT NULL UNIQUE,
			fingerprint TEXT NOT NULL DEFAULT '',
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS public_key TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS fingerprint TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_ssh_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_ssh_keys_owner_email_idx ON panel_ssh_keys (owner_email)`,
		`CREATE TABLE IF NOT EXISTS panel_install_jobs (
			id TEXT PRIMARY KEY,
			kind TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'queued',
			step_index INT NOT NULL DEFAULT 0,
			step_total INT NOT NULL DEFAULT 0,
			step_label TEXT NOT NULL DEFAULT '',
			message TEXT NOT NULL DEFAULT '',
			domain TEXT NOT NULL DEFAULT '',
			subdomain TEXT NOT NULL DEFAULT '',
			full_domain TEXT NOT NULL DEFAULT '',
			app_type TEXT NOT NULL DEFAULT 'plain',
			owner_email TEXT NOT NULL DEFAULT '',
			error_message TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			completed_at TIMESTAMPTZ
		)`,
		`CREATE TABLE IF NOT EXISTS panel_databases (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			domain TEXT NOT NULL,
			engine TEXT NOT NULL,
			name TEXT NOT NULL,
			username TEXT NOT NULL,
			connection_uri TEXT NOT NULL,
			host TEXT NOT NULL,
			port TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (engine, name)
		)`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS engine TEXT NOT NULL DEFAULT 'postgres'`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS connection_uri TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS host TEXT NOT NULL DEFAULT '127.0.0.1'`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS port TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_databases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_databases_owner_email_idx ON panel_databases (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_databases_domain_idx ON panel_databases (domain)`,
		`CREATE TABLE IF NOT EXISTS panel_ftp_accounts (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			site_target TEXT NOT NULL,
			target_kind TEXT NOT NULL DEFAULT 'domain',
			base_path TEXT NOT NULL DEFAULT '',
			username TEXT NOT NULL,
			password_enc TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS site_target TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS target_kind TEXT NOT NULL DEFAULT 'domain'`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS base_path TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS password_enc TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_ftp_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_ftp_accounts_owner_email_idx ON panel_ftp_accounts (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_ftp_accounts_site_target_idx ON panel_ftp_accounts (site_target)`,
		`CREATE TABLE IF NOT EXISTS panel_shell_sessions (
			id BIGSERIAL PRIMARY KEY,
			owner_email TEXT NOT NULL REFERENCES panel_users(email) ON DELETE CASCADE,
			site_target TEXT NOT NULL,
			target_kind TEXT NOT NULL DEFAULT 'domain',
			base_path TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT TRUE,
			last_command TEXT NOT NULL DEFAULT '',
			last_output TEXT NOT NULL DEFAULT '',
			last_exit_code INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS site_target TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS target_kind TEXT NOT NULL DEFAULT 'domain'`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS base_path TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS last_command TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS last_output TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS last_exit_code INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`ALTER TABLE panel_shell_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_shell_sessions_owner_email_idx ON panel_shell_sessions (owner_email)`,
		`CREATE INDEX IF NOT EXISTS panel_shell_sessions_site_target_idx ON panel_shell_sessions (site_target)`,
		`CREATE TABLE IF NOT EXISTS panel_shell_logs (
			id BIGSERIAL PRIMARY KEY,
			session_id BIGINT NOT NULL REFERENCES panel_shell_sessions(id) ON DELETE CASCADE,
			command TEXT NOT NULL DEFAULT '',
			output TEXT NOT NULL DEFAULT '',
			exit_code INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE panel_shell_logs ADD COLUMN IF NOT EXISTS session_id BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_shell_logs ADD COLUMN IF NOT EXISTS command TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_logs ADD COLUMN IF NOT EXISTS output TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE panel_shell_logs ADD COLUMN IF NOT EXISTS exit_code INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE panel_shell_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`CREATE INDEX IF NOT EXISTS panel_shell_logs_session_id_idx ON panel_shell_logs (session_id)`,
		`UPDATE panel_users
		 SET email_verified = TRUE,
		     email_verified_at = COALESCE(email_verified_at, approved_at, created_at),
		     updated_at = NOW()
		 WHERE (approved = TRUE OR is_admin = TRUE) AND email_verified = FALSE`,
	}

	for _, stmt := range migrations {
		if _, err := s.db.Exec(stmt); err != nil {
			return err
		}
	}

	return nil
}

func ensureMailSchema(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS mail_sessions (
			token_hash TEXT PRIMARY KEY,
			email TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			expires_at TIMESTAMPTZ NOT NULL,
			last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS mail_sessions_email_idx ON mail_sessions (email)`,
		`CREATE INDEX IF NOT EXISTS mail_sessions_expires_at_idx ON mail_sessions (expires_at)`,
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return err
		}
	}
	return nil
}

func (s *server) seedBootstrapUser() error {
	email := normalizeEmail(envOr("DIWORKIN_BOOTSTRAP_EMAIL", "admin@diworkin.com"))
	password := envOr("DIWORKIN_BOOTSTRAP_PASSWORD", "")
	if email == "" || password == "" {
		return nil
	}

	name := strings.TrimSpace(envOr("DIWORKIN_BOOTSTRAP_NAME", "Diworkin Admin"))
	if name == "" {
		name = "Diworkin Admin"
	}
	company := strings.TrimSpace(envOr("DIWORKIN_BOOTSTRAP_COMPANY", "Diworkin"))

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		`INSERT INTO panel_users (name, company, email, password_hash, email_verified, email_verified_at, approved, is_admin, approved_at)
		 VALUES ($1, $2, $3, $4, TRUE, NOW(), TRUE, TRUE, NOW())
		 ON CONFLICT (email) DO UPDATE
		 SET name = EXCLUDED.name,
		     company = EXCLUDED.company,
		     password_hash = EXCLUDED.password_hash,
		     email_verified = TRUE,
		     email_verified_at = COALESCE(panel_users.email_verified_at, NOW()),
		     approved = TRUE,
		     is_admin = TRUE,
		     approved_at = COALESCE(panel_users.approved_at, NOW()),
		     updated_at = NOW()`,
		name,
		company,
		email,
		string(passwordHash),
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil
		}
		return err
	}

	log.Printf("seeded bootstrap panel user %s", email)
	return nil
}

func (s *server) healthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeAuthRequest(w, r)
	if err != nil {
		s.respondAuthFailure(w, r, http.StatusBadRequest, err.Error())
		return
	}

	user, passwordHash, err := s.lookupUser(req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.respondAuthFailure(w, r, http.StatusUnauthorized, "email or password is incorrect")
			return
		}
		s.respondAuthFailure(w, r, http.StatusInternalServerError, "failed to read account")
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)) != nil {
		s.respondAuthFailure(w, r, http.StatusUnauthorized, "email or password is incorrect")
		return
	}

	if !user.EmailVerified {
		s.respondAuthFailure(w, r, http.StatusForbidden, "verify your email first")
		return
	}

	if !user.Approved {
		s.respondAuthFailure(w, r, http.StatusForbidden, "account is waiting for admin approval")
		return
	}

	sessionToken, expiresAt, err := s.createSession(user.Email)
	if err != nil {
		s.respondAuthFailure(w, r, http.StatusInternalServerError, "failed to create session")
		return
	}

	s.setSessionCookie(w, sessionToken, expiresAt)
	if s.wantsBrowserRedirect(r) {
		http.Redirect(w, r, "/projects", http.StatusSeeOther)
		return
	}
	writeJSON(w, http.StatusOK, authResponse{User: user, Status: "authenticated"})
}

func (s *server) register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeAuthRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	email := normalizeEmail(req.Email)
	if req.ReferralCode == "" {
		req.ReferralCode = strings.TrimSpace(r.URL.Query().Get("ref"))
	}
	if req.CouponCode == "" {
		req.CouponCode = strings.TrimSpace(r.URL.Query().Get("coupon"))
	}
	if req.Name == "" || email == "" || len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "name, email, and a password of at least 8 characters are required")
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to process password")
		return
	}

	tx, err := s.db.BeginTx(r.Context(), nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create account")
		return
	}

	_, err = tx.Exec(
		`INSERT INTO panel_users (name, company, email, password_hash, email_verified, approved, is_admin)
		 VALUES ($1, $2, $3, $4, FALSE, FALSE, FALSE)`,
		req.Name,
		strings.TrimSpace(req.Company),
		email,
		string(passwordHash),
	)
	if err != nil {
		_ = tx.Rollback()
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "email is already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create account")
		return
	}

	verificationToken, err := randomToken(32)
	if err != nil {
		_ = tx.Rollback()
		writeError(w, http.StatusInternalServerError, "failed to prepare email verification")
		return
	}

	tokenHash := s.hashToken(verificationToken)
	expiresAt := time.Now().Add(24 * time.Hour)
	_, err = tx.Exec(
		`INSERT INTO panel_email_verification_tokens (token_hash, email, expires_at)
		 VALUES ($1, $2, $3)`,
		tokenHash,
		email,
		expiresAt,
	)
	if err != nil {
		_ = tx.Rollback()
		writeError(w, http.StatusInternalServerError, "failed to prepare email verification")
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create account")
		return
	}

	user, err := s.loadUser(email)
	if err != nil {
		_, _ = s.db.Exec(`DELETE FROM panel_users WHERE lower(email) = lower($1)`, email)
		writeError(w, http.StatusInternalServerError, "failed to read account")
		return
	}

	if err := s.sendVerificationEmail(user, verificationToken); err != nil {
		log.Printf("send verification email failed for %s: %v", email, err)
		_, _ = s.db.Exec(`DELETE FROM panel_users WHERE lower(email) = lower($1)`, email)
		writeError(w, http.StatusInternalServerError, "failed to send verification email")
		return
	}

	if req.ReferralCode != "" || req.CouponCode != "" {
		if err := s.recordAffiliateReferral(email, req.ReferralCode, req.CouponCode); err != nil {
			log.Printf("record affiliate referral failed for %s: %v", email, err)
		}
	}

	if _, err := s.ensureAffiliateForUser(user); err != nil {
		log.Printf("ensure affiliate failed for %s: %v", email, err)
	}

	writeJSON(w, http.StatusCreated, authResponse{
		User:    user,
		Status:  "verification_required",
		Message: "Account created successfully. Check your email to verify it before admin approval.",
	})
}

func (s *server) verifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" && r.Method == http.MethodPost {
		var payload struct {
			Token string `json:"token"`
		}
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&payload); err == nil {
			token = strings.TrimSpace(payload.Token)
		}
	}
	if token == "" {
		writeError(w, http.StatusBadRequest, "token is required")
		return
	}

	tokenHash := s.hashToken(token)
	tx, err := s.db.BeginTx(r.Context(), nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify email")
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var email string
	var expiresAt time.Time
	var consumedAt sql.NullTime
	err = tx.QueryRow(
		`SELECT email, expires_at, consumed_at
		 FROM panel_email_verification_tokens
		 WHERE token_hash = $1`,
		tokenHash,
	).Scan(&email, &expiresAt, &consumedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "verification token is invalid")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to verify email")
		return
	}

	if consumedAt.Valid {
		user, err := s.loadUser(email)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load account")
			return
		}
		writeJSON(w, http.StatusOK, verifyEmailResponse{
			User:    user,
			Status:  "already_verified",
			Message: "Email has already been verified.",
		})
		return
	}

	if time.Now().After(expiresAt) {
		writeError(w, http.StatusGone, "verification token has expired")
		return
	}

	_, err = tx.Exec(
		`UPDATE panel_users
		 SET email_verified = TRUE,
		     email_verified_at = COALESCE(email_verified_at, NOW()),
		     updated_at = NOW()
		 WHERE lower(email) = lower($1)`,
		email,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify email")
		return
	}

	_, err = tx.Exec(
		`UPDATE panel_email_verification_tokens
		 SET consumed_at = NOW()
		 WHERE token_hash = $1`,
		tokenHash,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify email")
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify email")
		return
	}

	user, err := s.loadUser(email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load account")
		return
	}

	writeJSON(w, http.StatusOK, verifyEmailResponse{
		User:    user,
		Status:  "verified",
		Message: "Email verified successfully. Wait for admin approval before logging in.",
	})
}

func (s *server) me(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{User: user, Status: "authenticated"})
}

func (s *server) logout(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_sessions WHERE token_hash = $1`, sess.TokenHash); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to log out")
		return
	}

	s.clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) metrics(w http.ResponseWriter, r *http.Request, _ sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	metrics := collectMetrics()
	writeJSON(w, http.StatusOK, metrics)
}

func (s *server) overview(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	domainQuery := `SELECT domain FROM panel_domains`
	domainArgs := []any{}
	if !user.IsAdmin {
		domainQuery += ` WHERE lower(owner_email) = lower($1)`
		domainArgs = append(domainArgs, normalizeEmail(sess.Email))
	}
	domainQuery += ` ORDER BY domain ASC`

	domainRows, err := s.db.Query(domainQuery, domainArgs...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load overview")
		return
	}
	defer domainRows.Close()

	visibleDomains := make([]string, 0)
	visibleDomainSet := make(map[string]struct{})
	for domainRows.Next() {
		var domain string
		if err := domainRows.Scan(&domain); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read overview")
			return
		}
		normalized := normalizeDomain(domain)
		if normalized == "" {
			continue
		}
		visibleDomains = append(visibleDomains, normalized)
		visibleDomainSet[normalized] = struct{}{}
	}

	activeDomains := len(visibleDomains)

	var mailboxAccounts int
	if user.IsAdmin {
		if err := s.mailDB.QueryRow(`SELECT COUNT(*) FROM mail_users`).Scan(&mailboxAccounts); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load overview")
			return
		}
	} else {
		rows, err := s.mailDB.Query(`SELECT email FROM mail_users ORDER BY email ASC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load overview")
			return
		}
		defer rows.Close()

		for rows.Next() {
			var email string
			if err := rows.Scan(&email); err != nil {
				writeError(w, http.StatusInternalServerError, "failed to read overview")
				return
			}
			parts := strings.SplitN(normalizeEmail(email), "@", 2)
			if len(parts) != 2 {
				continue
			}
			if _, ok := visibleDomainSet[parts[1]]; ok {
				mailboxAccounts++
			}
		}
	}

	queuedQuery := `SELECT COUNT(*) FROM panel_install_jobs WHERE status = 'queued'`
	queuedArgs := []any{}
	if !user.IsAdmin {
		queuedQuery += ` AND lower(owner_email) = lower($1)`
		queuedArgs = append(queuedArgs, normalizeEmail(sess.Email))
	}

	var queuedMail int
	if err := s.db.QueryRow(queuedQuery, queuedArgs...).Scan(&queuedMail); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load overview")
		return
	}

	var openSupportChats int
	if user.IsAdmin {
		if err := s.db.QueryRow(`SELECT COUNT(*) FROM panel_support_conversations WHERE unread_for_admin = TRUE AND status <> 'closed'`).Scan(&openSupportChats); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load overview")
			return
		}
	}

	writeJSON(w, http.StatusOK, overviewStatsResponse{
		ActiveDomains:   activeDomains,
		MailboxAccounts: mailboxAccounts,
		QueuedMail:      queuedMail,
		OpenSupportChats: openSupportChats,
	})
}

func (s *server) adminUsers(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	rows, err := s.db.Query(
		`SELECT name, company, email, email_verified, email_verified_at, approved, is_admin, created_at, approved_at
		 FROM panel_users
		 ORDER BY created_at DESC, email ASC`,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load users")
		return
	}
	defer rows.Close()

	type adminUser struct {
		Name            string `json:"name"`
		Company         string `json:"company,omitempty"`
		Email           string `json:"email"`
		Initials        string `json:"initials"`
		Approved        bool   `json:"approved"`
		IsAdmin         bool   `json:"is_admin"`
		EmailVerified   bool   `json:"email_verified"`
		Status          string `json:"status"`
		CreatedAt       string `json:"created_at"`
		ApprovedAt      string `json:"approved_at,omitempty"`
		EmailVerifiedAt string `json:"email_verified_at,omitempty"`
	}

	users := make([]adminUser, 0)
	for rows.Next() {
		var item adminUser
		var createdAt time.Time
		var emailVerifiedAt sql.NullTime
		var approvedAt sql.NullTime

		if err := rows.Scan(&item.Name, &item.Company, &item.Email, &item.EmailVerified, &emailVerifiedAt, &item.Approved, &item.IsAdmin, &createdAt, &approvedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read users")
			return
		}

		item.Initials = getInitials(item.Name, getInitials(item.Email, "DW"))
		item.CreatedAt = createdAt.Format(time.RFC3339)
		if emailVerifiedAt.Valid {
			item.EmailVerifiedAt = emailVerifiedAt.Time.Format(time.RFC3339)
		}
		item.Status = "pending_verification"
		if item.EmailVerified {
			item.Status = "pending_approval"
		}
		if item.Approved {
			item.Status = "approved"
		}
		if approvedAt.Valid {
			item.ApprovedAt = approvedAt.Time.Format(time.RFC3339)
		}

		users = append(users, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

func (s *server) approveUser(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeApproveRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	target, err := s.loadUser(normalizeEmail(req.Email))
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	if !target.EmailVerified {
		writeError(w, http.StatusConflict, "email has not been verified")
		return
	}

	result, err := s.db.Exec(
		`UPDATE panel_users
		 SET approved = TRUE, approved_at = NOW(), updated_at = NOW()
		 WHERE lower(email) = lower($1)`,
		normalizeEmail(req.Email),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to approve user")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "approved"})
}

func (s *server) packages(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listPackages(w, sess)
	case http.MethodPost:
		s.createPackage(w, r, sess)
	case http.MethodPatch:
		s.updatePackage(w, r, sess)
	case http.MethodDelete:
		s.deletePackage(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listPackages(w http.ResponseWriter, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	rows, err := s.db.Query(
		`SELECT id, name, description, price_rupiah, billing_cycle, disk_quota_gb, email_quota, subdomain_quota, database_quota, domain_quota,
			feature_ssl, feature_backup, feature_ssh, feature_file_manager, feature_studio, feature_auto_installer, feature_dns, feature_mail, feature_priority_support,
			active, created_at, updated_at
		 FROM panel_packages
		 ORDER BY active DESC, created_at DESC, name ASC`,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load package")
		return
	}
	defer rows.Close()

	items := make([]packageItem, 0)
	for rows.Next() {
		var item packageItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.Description,
			&item.PriceRupiah,
			&item.BillingCycle,
			&item.DiskQuotaGB,
			&item.EmailQuota,
			&item.SubdomainQuota,
			&item.DatabaseQuota,
			&item.DomainQuota,
			&item.FeatureSSL,
			&item.FeatureBackup,
			&item.FeatureSSH,
			&item.FeatureFileManager,
			&item.FeatureStudio,
			&item.FeatureAutoInstaller,
			&item.FeatureDNS,
			&item.FeatureMail,
			&item.FeaturePriority,
			&item.Active,
			&createdAt,
			&updatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read package")
			return
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"packages": items})
}

func (s *server) createPackage(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodePackageRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "package name is required")
		return
	}
	switch req.BillingCycle {
	case "monthly", "yearly", "quarterly", "lifetime":
	default:
		writeError(w, http.StatusBadRequest, "invalid billing cycle")
		return
	}
	if req.PriceRupiah < 0 {
		req.PriceRupiah = 0
	}
	if req.DiskQuotaGB < 0 || req.EmailQuota < 0 || req.SubdomainQuota < 0 || req.DatabaseQuota < 0 || req.DomainQuota < 0 {
		writeError(w, http.StatusBadRequest, "invalid package quota")
		return
	}

	now := time.Now().UTC()
	var id int64
	err = s.db.QueryRow(
		`INSERT INTO panel_packages (
			name, description, price_rupiah, billing_cycle,
			disk_quota_gb, email_quota, subdomain_quota, database_quota, domain_quota,
			feature_ssl, feature_backup, feature_ssh, feature_file_manager, feature_studio,
			feature_auto_installer, feature_dns, feature_mail, feature_priority_support,
			active, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8, $9,
			$10, $11, $12, $13, $14,
			$15, $16, $17, $18,
			$19, $20, $21
		) RETURNING id`,
		req.Name,
		req.Description,
		req.PriceRupiah,
		req.BillingCycle,
		req.DiskQuotaGB,
		req.EmailQuota,
		req.SubdomainQuota,
		req.DatabaseQuota,
		req.DomainQuota,
		req.FeatureSSL,
		req.FeatureBackup,
		req.FeatureSSH,
		req.FeatureFileManager,
		req.FeatureStudio,
		req.FeatureAutoInstaller,
		req.FeatureDNS,
		req.FeatureMail,
		req.FeaturePriority,
		req.Active,
		now,
		now,
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "package name already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save package")
		return
	}

	item, err := s.loadPackageItem(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "package saved, but failed to load details")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "Package created successfully.",
		"package": item,
	})
}

func (s *server) updatePackage(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodePackageRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "package ID is required")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "package name is required")
		return
	}
	switch req.BillingCycle {
	case "monthly", "yearly", "quarterly", "lifetime":
	default:
		writeError(w, http.StatusBadRequest, "invalid billing cycle")
		return
	}
	if req.PriceRupiah < 0 {
		req.PriceRupiah = 0
	}
	if req.DiskQuotaGB < 0 || req.EmailQuota < 0 || req.SubdomainQuota < 0 || req.DatabaseQuota < 0 || req.DomainQuota < 0 {
		writeError(w, http.StatusBadRequest, "invalid package quota")
		return
	}

	result, err := s.db.Exec(
		`UPDATE panel_packages
		 SET name = $2,
		     description = $3,
		     price_rupiah = $4,
		     billing_cycle = $5,
		     disk_quota_gb = $6,
		     email_quota = $7,
		     subdomain_quota = $8,
		     database_quota = $9,
		     domain_quota = $10,
		     feature_ssl = $11,
		     feature_backup = $12,
		     feature_ssh = $13,
		     feature_file_manager = $14,
		     feature_studio = $15,
		     feature_auto_installer = $16,
		     feature_dns = $17,
		     feature_mail = $18,
		     feature_priority_support = $19,
		     active = $20,
		     updated_at = NOW()
		 WHERE id = $1`,
		req.ID,
		req.Name,
		req.Description,
		req.PriceRupiah,
		req.BillingCycle,
		req.DiskQuotaGB,
		req.EmailQuota,
		req.SubdomainQuota,
		req.DatabaseQuota,
		req.DomainQuota,
		req.FeatureSSL,
		req.FeatureBackup,
		req.FeatureSSH,
		req.FeatureFileManager,
		req.FeatureStudio,
		req.FeatureAutoInstaller,
		req.FeatureDNS,
		req.FeatureMail,
		req.FeaturePriority,
		req.Active,
	)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "package name already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update package")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "package not found")
		return
	}

	item, err := s.loadPackageItem(req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load package")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "Package updated successfully.",
		"package": item,
	})
}

func (s *server) deletePackage(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "package ID is required")
		return
	}

	result, err := s.db.Exec(`DELETE FROM panel_packages WHERE id = $1`, req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete package")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "package not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Package deleted successfully.",
	})
}

func (s *server) loadPackageItem(id int64) (packageItem, error) {
	var item packageItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT id, name, description, price_rupiah, billing_cycle, disk_quota_gb, email_quota, subdomain_quota, database_quota, domain_quota,
			feature_ssl, feature_backup, feature_ssh, feature_file_manager, feature_studio, feature_auto_installer, feature_dns, feature_mail, feature_priority_support,
			active, created_at, updated_at
		 FROM panel_packages
		 WHERE id = $1`,
		id,
	).Scan(
		&item.ID,
		&item.Name,
		&item.Description,
		&item.PriceRupiah,
		&item.BillingCycle,
		&item.DiskQuotaGB,
		&item.EmailQuota,
		&item.SubdomainQuota,
		&item.DatabaseQuota,
		&item.DomainQuota,
		&item.FeatureSSL,
		&item.FeatureBackup,
		&item.FeatureSSH,
		&item.FeatureFileManager,
		&item.FeatureStudio,
		&item.FeatureAutoInstaller,
		&item.FeatureDNS,
		&item.FeatureMail,
		&item.FeaturePriority,
		&item.Active,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return packageItem{}, err
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) licenses(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listLicenses(w, sess)
	case http.MethodPost:
		s.createLicense(w, r, sess)
	case http.MethodPatch:
		s.updateLicense(w, r, sess)
	case http.MethodDelete:
		s.deleteLicense(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) verifyLicense(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeLicenseVerifyRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	req.LicenseKey = strings.TrimSpace(req.LicenseKey)
	req.Domain = normalizeDomain(req.Domain)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.LicenseType = normalizeLicenseType(req.LicenseType)

	if req.LicenseKey == "" {
		writeError(w, http.StatusBadRequest, "license key is required")
		return
	}

	var item licenseItem
	var ownerEmail string
	var sourceBillingID sql.NullInt64
	var expiresAt sql.NullTime
	var activatedAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time

	err = s.db.QueryRow(
		`SELECT l.id, l.source_billing_id, l.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''), l.product_name, l.domain, l.license_key,
		        l.license_type, l.status, l.expires_at, l.activated_at, l.notes, l.created_at, l.updated_at
		 FROM panel_licenses l
		 LEFT JOIN panel_users u ON u.email = l.owner_email
		 WHERE lower(l.license_key) = lower($1)`,
		req.LicenseKey,
	).Scan(
		&item.ID,
		&item.SourceBillingID,
		&ownerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ProductName,
		&item.Domain,
		&item.LicenseKey,
		&item.LicenseType,
		&item.Status,
		&expiresAt,
		&activatedAt,
		&item.Notes,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "license not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to verify license")
		return
	}

	item.OwnerEmail = ownerEmail
	if sourceBillingID.Valid {
		item.SourceBillingID = sourceBillingID.Int64
	}
	if expiresAt.Valid {
		item.ExpiresAt = expiresAt.Time.UTC().Format(time.RFC3339)
	}
	if activatedAt.Valid {
		item.ActivatedAt = activatedAt.Time.UTC().Format(time.RFC3339)
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	if req.ProductName != "" && !strings.EqualFold(strings.TrimSpace(req.ProductName), strings.TrimSpace(item.ProductName)) && strings.TrimSpace(item.ProductName) != "" {
		writeError(w, http.StatusForbidden, "license product does not match")
		return
	}
	if req.LicenseType != "" && !strings.EqualFold(strings.TrimSpace(req.LicenseType), strings.TrimSpace(item.LicenseType)) && strings.TrimSpace(item.LicenseType) != "" {
		writeError(w, http.StatusForbidden, "license type does not match")
		return
	}

	status := strings.ToLower(strings.TrimSpace(item.Status))
	if status != "active" {
		writeError(w, http.StatusForbidden, "license is inactive")
		return
	}
	if expiresAt.Valid && time.Now().UTC().After(expiresAt.Time.UTC()) {
		_, _ = s.db.Exec(
			`UPDATE panel_licenses SET status = 'expired', updated_at = NOW() WHERE id = $1`,
			item.ID,
		)
		writeError(w, http.StatusForbidden, "license has expired")
		return
	}

	storedDomain := normalizeDomain(item.Domain)
	if req.Domain != "" && storedDomain != "" && req.Domain != storedDomain {
		writeError(w, http.StatusForbidden, "license domain does not match")
		return
	}

	if req.Domain != "" && storedDomain == "" {
		if _, err := s.db.Exec(
			`UPDATE panel_licenses SET domain = $2, activated_at = COALESCE(activated_at, NOW()), updated_at = NOW() WHERE id = $1`,
			item.ID,
			req.Domain,
		); err == nil {
			item.Domain = req.Domain
			activatedAt = sql.NullTime{Time: time.Now().UTC(), Valid: true}
			item.ActivatedAt = activatedAt.Time.UTC().Format(time.RFC3339)
		}
	}

	if activatedAt.Valid {
		item.ActivatedAt = activatedAt.Time.UTC().Format(time.RFC3339)
	}

	writeJSON(w, http.StatusOK, licenseVerifyResponse{
		Valid:   true,
		Message: "License valid.",
		License: item,
	})
}


func (s *server) loadLicenseByBillingID(billingID int64) (licenseItem, error) {
	var item licenseItem
	var sourceBillingID sql.NullInt64
	var expiresAt sql.NullTime
	var activatedAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT l.id, l.source_billing_id, l.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''), l.product_name, l.domain, l.license_key,
		        l.license_type, l.status, l.expires_at, l.activated_at, l.notes, l.created_at, l.updated_at
		 FROM panel_licenses l
		 LEFT JOIN panel_users u ON u.email = l.owner_email
		 WHERE l.source_billing_id = $1`,
		billingID,
	).Scan(
		&item.ID,
		&sourceBillingID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ProductName,
		&item.Domain,
		&item.LicenseKey,
		&item.LicenseType,
		&item.Status,
		&expiresAt,
		&activatedAt,
		&item.Notes,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return licenseItem{}, err
	}
	if sourceBillingID.Valid {
		item.SourceBillingID = sourceBillingID.Int64
	}
	if expiresAt.Valid {
		item.ExpiresAt = expiresAt.Time.UTC().Format(time.RFC3339)
	}
	if activatedAt.Valid {
		item.ActivatedAt = activatedAt.Time.UTC().Format(time.RFC3339)
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) syncLicenseFromBilling(item billingItem) error {
	invoiceNumber := strings.TrimSpace(item.InvoiceNumber)
	if invoiceNumber == "" || item.ID <= 0 {
		return nil
	}

	status := strings.ToLower(strings.TrimSpace(item.Status))
	existing, err := s.loadLicenseByBillingID(item.ID)
	hasExisting := err == nil
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	if status != "paid" {
		return nil
	}

	ownerEmail := normalizeEmail(item.CustomerEmail)
	if ownerEmail == "" {
		return nil
	}
	if _, err := s.loadUser(ownerEmail); err != nil {
		return err
	}

	productName := strings.TrimSpace(item.PackageName)
	if productName == "" {
		productName = "Diworkin Hosting"
	}
	domain := normalizeDomain(item.Domain)
	licenseType := "hosting"
	now := time.Now().UTC()
	notes := strings.TrimSpace(item.Notes)
	if notes == "" {
		notes = fmt.Sprintf("Auto-generated from billing %s", invoiceNumber)
	} else {
		notes = fmt.Sprintf("%s | Auto-generated from billing %s", notes, invoiceNumber)
	}

	expiresAt, err := parseOptionalLicenseTime(item.PeriodEndAt)
	if err != nil {
		return err
	}
	activatedAt, err := parseOptionalLicenseTime(item.PaidAt)
	if err != nil {
		return err
	}
	if !activatedAt.Valid {
		activatedAt = sql.NullTime{Time: now, Valid: true}
	}

	if hasExisting {
		_, err = s.db.Exec(
			`UPDATE panel_licenses
			    SET owner_email = $2,
			        source_billing_id = $3,
			        product_name = $4,
			        domain = $5,
			        license_type = $6,
			        status = 'active',
			        expires_at = $7,
			        activated_at = $8,
			        notes = $9,
			        updated_at = NOW()
			  WHERE id = $1`,
			existing.ID,
			ownerEmail,
			item.ID,
			productName,
			domain,
			licenseType,
			nullTimePtr(expiresAt),
			nullTimePtr(activatedAt),
			notes,
		)
	} else {
		_, err = s.db.Exec(
			`INSERT INTO panel_licenses (
				owner_email, source_billing_id, product_name, domain, license_key, license_type, status, expires_at, activated_at, notes, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11
			)`,
			ownerEmail,
			item.ID,
			productName,
			domain,
			generateLicenseKey(),
			licenseType,
			nullTimePtr(expiresAt),
			nullTimePtr(activatedAt),
			notes,
			now,
			now,
		)
	}
	if err != nil {
		return err
	}

	return nil
}

func (s *server) listLicenses(w http.ResponseWriter, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	rows, err := s.db.Query(
		`SELECT l.id, l.source_billing_id, l.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''), l.product_name, l.domain, l.license_key,
		        l.license_type, l.status, l.expires_at, l.activated_at, l.notes, l.created_at, l.updated_at
		 FROM panel_licenses l
		 LEFT JOIN panel_users u ON u.email = l.owner_email
		 ORDER BY l.status = 'active' DESC, l.created_at DESC, l.id DESC`,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load license")
		return
	}
	defer rows.Close()

	items := make([]licenseItem, 0)
	for rows.Next() {
		var item licenseItem
		var sourceBillingID sql.NullInt64
		var ownerName string
		var company string
		var expiresAt sql.NullTime
		var activatedAt sql.NullTime
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&sourceBillingID,
			&item.OwnerEmail,
			&ownerName,
			&company,
			&item.ProductName,
			&item.Domain,
			&item.LicenseKey,
			&item.LicenseType,
			&item.Status,
			&expiresAt,
			&activatedAt,
			&item.Notes,
			&createdAt,
			&updatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read license")
			return
		}
		if sourceBillingID.Valid {
			item.SourceBillingID = sourceBillingID.Int64
		}
		item.OwnerName = ownerName
		item.Company = company
		if expiresAt.Valid {
			item.ExpiresAt = expiresAt.Time.UTC().Format(time.RFC3339)
		}
		if activatedAt.Valid {
			item.ActivatedAt = activatedAt.Time.UTC().Format(time.RFC3339)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"licenses": items})
}

func (s *server) createLicense(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeLicenseRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	req.OwnerEmail = normalizeEmail(req.OwnerEmail)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Domain = strings.TrimSpace(req.Domain)
	req.LicenseType = normalizeLicenseType(req.LicenseType)
	req.Status = normalizeLicenseStatus(req.Status)
	req.Notes = strings.TrimSpace(req.Notes)

	if req.OwnerEmail == "" {
		writeError(w, http.StatusBadRequest, "owner email is required")
		return
	}
	if _, err := s.loadUser(req.OwnerEmail); err != nil {
		writeError(w, http.StatusBadRequest, "owner email not found")
		return
	}
	if req.ProductName == "" {
		writeError(w, http.StatusBadRequest, "product name is required")
		return
	}
	if req.LicenseType == "" {
		req.LicenseType = "panel"
	}
	if req.Status == "" {
		req.Status = "active"
	}
	if req.LicenseKey == "" {
		req.LicenseKey = generateLicenseKey()
	}

	expiresAt, err := parseOptionalLicenseTime(req.ExpiresAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid expiration date")
		return
	}
	activatedAt, err := parseOptionalLicenseTime(req.ActivatedAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid activation date")
		return
	}

	now := time.Now().UTC()
	var id int64
	err = s.db.QueryRow(
		`INSERT INTO panel_licenses (
			owner_email, product_name, domain, license_key, license_type, status, expires_at, activated_at, notes, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) RETURNING id`,
		req.OwnerEmail,
		req.ProductName,
		req.Domain,
		req.LicenseKey,
		req.LicenseType,
		req.Status,
		nullTimePtr(expiresAt),
		nullTimePtr(activatedAt),
		req.Notes,
		now,
		now,
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "license key is already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save license")
		return
	}

	item, err := s.loadLicenseItem(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "license saved, but failed to load details")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "License created successfully.",
		"license": item,
	})
}

func (s *server) updateLicense(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeLicenseRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "license ID is required")
		return
	}

	req.OwnerEmail = normalizeEmail(req.OwnerEmail)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Domain = strings.TrimSpace(req.Domain)
	req.LicenseType = normalizeLicenseType(req.LicenseType)
	req.Status = normalizeLicenseStatus(req.Status)
	req.Notes = strings.TrimSpace(req.Notes)

	if req.OwnerEmail == "" {
		writeError(w, http.StatusBadRequest, "owner email is required")
		return
	}
	if _, err := s.loadUser(req.OwnerEmail); err != nil {
		writeError(w, http.StatusBadRequest, "owner email not found")
		return
	}
	if req.ProductName == "" {
		writeError(w, http.StatusBadRequest, "product name is required")
		return
	}
	if req.LicenseType == "" {
		req.LicenseType = "panel"
	}
	if req.Status == "" {
		req.Status = "active"
	}
	if req.LicenseKey == "" {
		item, err := s.loadLicenseItem(req.ID)
		if err == nil {
			req.LicenseKey = item.LicenseKey
		}
		if req.LicenseKey == "" {
			req.LicenseKey = generateLicenseKey()
		}
	}

	expiresAt, err := parseOptionalLicenseTime(req.ExpiresAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid expiration date")
		return
	}
	activatedAt, err := parseOptionalLicenseTime(req.ActivatedAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid activation date")
		return
	}

	result, err := s.db.Exec(
		`UPDATE panel_licenses
		 SET owner_email = $2,
		     product_name = $3,
		     domain = $4,
		     license_key = $5,
		     license_type = $6,
		     status = $7,
		     expires_at = $8,
		     activated_at = $9,
		     notes = $10,
		     updated_at = NOW()
		 WHERE id = $1`,
		req.ID,
		req.OwnerEmail,
		req.ProductName,
		req.Domain,
		req.LicenseKey,
		req.LicenseType,
		req.Status,
		nullTimePtr(expiresAt),
		nullTimePtr(activatedAt),
		req.Notes,
	)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "license key is already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update license")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "license not found")
		return
	}

	item, err := s.loadLicenseItem(req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load license")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "License updated successfully.",
		"license": item,
	})
}

func (s *server) deleteLicense(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "license ID is required")
		return
	}

	result, err := s.db.Exec(`DELETE FROM panel_licenses WHERE id = $1`, req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete license")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "license not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "License deleted successfully.",
	})
}

func (s *server) loadLicenseItem(id int64) (licenseItem, error) {
	var item licenseItem
	var sourceBillingID sql.NullInt64
	var expiresAt sql.NullTime
	var activatedAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT l.id, l.source_billing_id, l.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''), l.product_name, l.domain, l.license_key,
		        l.license_type, l.status, l.expires_at, l.activated_at, l.notes, l.created_at, l.updated_at
		 FROM panel_licenses l
		 LEFT JOIN panel_users u ON u.email = l.owner_email
		 WHERE l.id = $1`,
		id,
	).Scan(
		&item.ID,
		&sourceBillingID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ProductName,
		&item.Domain,
		&item.LicenseKey,
		&item.LicenseType,
		&item.Status,
		&expiresAt,
		&activatedAt,
		&item.Notes,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return licenseItem{}, err
	}

	if sourceBillingID.Valid {
		item.SourceBillingID = sourceBillingID.Int64
	}
	if expiresAt.Valid {
		item.ExpiresAt = expiresAt.Time.UTC().Format(time.RFC3339)
	}
	if activatedAt.Valid {
		item.ActivatedAt = activatedAt.Time.UTC().Format(time.RFC3339)
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) billing(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listBilling(w, sess)
	case http.MethodPost:
		s.createBilling(w, r, sess)
	case http.MethodPatch:
		s.updateBilling(w, r, sess)
	case http.MethodDelete:
		s.deleteBilling(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listBilling(w http.ResponseWriter, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	rows, err := s.db.Query(
		`SELECT b.id, b.invoice_number, COALESCE(b.package_id, 0), COALESCE(b.package_name, ''), b.customer_name, b.customer_email, b.domain,
		        b.billing_cycle, b.amount_rupiah, b.status, b.due_at, b.period_start_at, b.period_end_at, b.paid_at, b.notes,
		        b.created_by, b.created_at, b.updated_at
		 FROM panel_billing_records b
		 ORDER BY b.created_at DESC, b.id DESC`,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load billing")
		return
	}
	defer rows.Close()

	items := make([]billingItem, 0)
	for rows.Next() {
		var item billingItem
		var packageID int64
		var dueAt sql.NullTime
		var periodStartAt sql.NullTime
		var periodEndAt sql.NullTime
		var paidAt sql.NullTime
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.InvoiceNumber,
			&packageID,
			&item.PackageName,
			&item.CustomerName,
			&item.CustomerEmail,
			&item.Domain,
			&item.BillingCycle,
			&item.AmountRupiah,
			&item.Status,
			&dueAt,
			&periodStartAt,
			&periodEndAt,
			&paidAt,
			&item.Notes,
			&item.CreatedBy,
			&createdAt,
			&updatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read billing")
			return
		}
		if packageID > 0 {
			item.PackageID = packageID
		}
		if dueAt.Valid {
			item.DueAt = dueAt.Time.UTC().Format(time.RFC3339)
		}
		if periodStartAt.Valid {
			item.PeriodStartAt = periodStartAt.Time.UTC().Format(time.RFC3339)
		}
		if periodEndAt.Valid {
			item.PeriodEndAt = periodEndAt.Time.UTC().Format(time.RFC3339)
		}
		if paidAt.Valid {
			item.PaidAt = paidAt.Time.UTC().Format(time.RFC3339)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"billing": items})
}

func (s *server) createBilling(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeBillingRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	req.CustomerName = strings.TrimSpace(req.CustomerName)
	req.CustomerEmail = normalizeEmail(req.CustomerEmail)
	req.Domain = strings.TrimSpace(req.Domain)
	req.BillingCycle = normalizeBillingCycle(req.BillingCycle)
	req.Status = normalizeBillingStatus(req.Status)
	if req.Status == "" {
		req.Status = "pending"
	}
	req.Notes = strings.TrimSpace(req.Notes)
	if req.CustomerName == "" {
		writeError(w, http.StatusBadRequest, "customer name is required")
		return
	}
	if req.CustomerEmail == "" {
		writeError(w, http.StatusBadRequest, "customer email is required")
		return
	}
	if req.PackageID <= 0 {
		writeError(w, http.StatusBadRequest, "package must be selected")
		return
	}

	pkg, err := s.loadPackageItem(req.PackageID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "package not found")
		return
	}
	if req.PackageName == "" {
		req.PackageName = pkg.Name
	}
	if req.BillingCycle == "" || req.BillingCycle == "custom" {
		req.BillingCycle = pkg.BillingCycle
	}
	if req.AmountRupiah <= 0 {
		req.AmountRupiah = pkg.PriceRupiah
	}
	if req.AmountRupiah < 0 {
		req.AmountRupiah = 0
	}
	if req.InvoiceNumber == "" {
		req.InvoiceNumber = generateBillingInvoiceNumber()
	}

	now := time.Now().UTC()
	dueAt, err := parseOptionalBillingTime(req.DueAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid due date")
		return
	}
	periodStartAt, err := parseOptionalBillingTime(req.PeriodStartAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid start date")
		return
	}
	periodEndAt, err := parseOptionalBillingTime(req.PeriodEndAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid end date")
		return
	}
	paidAt, err := parseOptionalBillingTime(req.PaidAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid paid date")
		return
	}
	if req.Status != "paid" {
		paidAt = sql.NullTime{}
	} else if !paidAt.Valid {
		paidAt = sql.NullTime{Time: now, Valid: true}
	}

	var id int64
	err = s.db.QueryRow(
		`INSERT INTO panel_billing_records (
			invoice_number, package_id, package_name, customer_name, customer_email, domain,
			billing_cycle, amount_rupiah, status, due_at, period_start_at, period_end_at, paid_at,
			notes, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17
		) RETURNING id`,
		req.InvoiceNumber,
		req.PackageID,
		req.PackageName,
		req.CustomerName,
		req.CustomerEmail,
		req.Domain,
		req.BillingCycle,
		req.AmountRupiah,
		req.Status,
		nullTimePtr(dueAt),
		nullTimePtr(periodStartAt),
		nullTimePtr(periodEndAt),
		nullTimePtr(paidAt),
		req.Notes,
		user.Email,
		now,
		now,
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "invoice number is already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save billing")
		return
	}

	item, err := s.loadBillingItem(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "billing saved, but failed to load details")
		return
	}
	if err := s.syncAffiliateCommissionFromBilling(item); err != nil {
		log.Printf("sync affiliate commission failed for billing %s: %v", item.InvoiceNumber, err)
	}
	if err := s.syncLicenseFromBilling(item); err != nil {
		log.Printf("sync license failed for billing %s: %v", item.InvoiceNumber, err)
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "Billing created successfully.",
		"billing": item,
	})
}

func (s *server) updateBilling(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeBillingRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "billing id is required")
		return
	}

	req.CustomerName = strings.TrimSpace(req.CustomerName)
	req.CustomerEmail = normalizeEmail(req.CustomerEmail)
	req.Domain = strings.TrimSpace(req.Domain)
	req.BillingCycle = normalizeBillingCycle(req.BillingCycle)
	req.Status = normalizeBillingStatus(req.Status)
	if req.Status == "" {
		req.Status = "pending"
	}
	req.Notes = strings.TrimSpace(req.Notes)
	if req.CustomerName == "" {
		writeError(w, http.StatusBadRequest, "customer name is required")
		return
	}
	if req.CustomerEmail == "" {
		writeError(w, http.StatusBadRequest, "customer email is required")
		return
	}
	if req.PackageID <= 0 {
		writeError(w, http.StatusBadRequest, "package must be selected")
		return
	}

	pkg, err := s.loadPackageItem(req.PackageID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "package not found")
		return
	}
	if req.PackageName == "" {
		req.PackageName = pkg.Name
	}
	if req.BillingCycle == "" || req.BillingCycle == "custom" {
		req.BillingCycle = pkg.BillingCycle
	}
	if req.AmountRupiah <= 0 {
		req.AmountRupiah = pkg.PriceRupiah
	}
	if req.AmountRupiah < 0 {
		req.AmountRupiah = 0
	}

	dueAt, err := parseOptionalBillingTime(req.DueAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid due date")
		return
	}
	periodStartAt, err := parseOptionalBillingTime(req.PeriodStartAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid start date")
		return
	}
	periodEndAt, err := parseOptionalBillingTime(req.PeriodEndAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid end date")
		return
	}
	paidAt, err := parseOptionalBillingTime(req.PaidAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid paid date")
		return
	}
	if req.Status != "paid" {
		paidAt = sql.NullTime{}
	} else if !paidAt.Valid {
		paidAt = sql.NullTime{Time: time.Now().UTC(), Valid: true}
	}

	result, err := s.db.Exec(
		`UPDATE panel_billing_records
		 SET package_id = $2,
		     package_name = $3,
		     customer_name = $4,
		     customer_email = $5,
		     domain = $6,
		     billing_cycle = $7,
		     amount_rupiah = $8,
		     status = $9,
		     due_at = $10,
		     period_start_at = $11,
		     period_end_at = $12,
		     paid_at = $13,
		     notes = $14,
		     updated_at = NOW()
		 WHERE id = $1`,
		req.ID,
		req.PackageID,
		req.PackageName,
		req.CustomerName,
		req.CustomerEmail,
		req.Domain,
		req.BillingCycle,
		req.AmountRupiah,
		req.Status,
		nullTimePtr(dueAt),
		nullTimePtr(periodStartAt),
		nullTimePtr(periodEndAt),
		nullTimePtr(paidAt),
		req.Notes,
	)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "invoice number is already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update billing")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "billing not found")
		return
	}

	item, err := s.loadBillingItem(req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load billing")
		return
	}
	if err := s.syncAffiliateCommissionFromBilling(item); err != nil {
		log.Printf("sync affiliate commission failed for billing %s: %v", item.InvoiceNumber, err)
	}
	if err := s.syncLicenseFromBilling(item); err != nil {
		log.Printf("sync license failed for billing %s: %v", item.InvoiceNumber, err)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "Billing updated successfully.",
		"billing": item,
	})
}

func (s *server) deleteBilling(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "billing id is required")
		return
	}

	result, err := s.db.Exec(`DELETE FROM panel_billing_records WHERE id = $1`, req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete billing")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "billing not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Billing deleted successfully.",
	})
}

func (s *server) loadBillingItem(id int64) (billingItem, error) {
	var item billingItem
	var packageID sql.NullInt64
	var dueAt sql.NullTime
	var periodStartAt sql.NullTime
	var periodEndAt sql.NullTime
	var paidAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT b.id, b.invoice_number, b.package_id, COALESCE(b.package_name, ''), b.customer_name, b.customer_email, b.domain,
		        b.billing_cycle, b.amount_rupiah, b.status, b.due_at, b.period_start_at, b.period_end_at, b.paid_at, b.notes,
		        b.created_by, b.created_at, b.updated_at
		 FROM panel_billing_records b
		 WHERE b.id = $1`,
		id,
	).Scan(
		&item.ID,
		&item.InvoiceNumber,
		&packageID,
		&item.PackageName,
		&item.CustomerName,
		&item.CustomerEmail,
		&item.Domain,
		&item.BillingCycle,
		&item.AmountRupiah,
		&item.Status,
		&dueAt,
		&periodStartAt,
		&periodEndAt,
		&paidAt,
		&item.Notes,
		&item.CreatedBy,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return billingItem{}, err
	}

	if packageID.Valid {
		item.PackageID = packageID.Int64
	}
	if dueAt.Valid {
		item.DueAt = dueAt.Time.UTC().Format(time.RFC3339)
	}
	if periodStartAt.Valid {
		item.PeriodStartAt = periodStartAt.Time.UTC().Format(time.RFC3339)
	}
	if periodEndAt.Valid {
		item.PeriodEndAt = periodEndAt.Time.UTC().Format(time.RFC3339)
	}
	if paidAt.Valid {
		item.PaidAt = paidAt.Time.UTC().Format(time.RFC3339)
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) affiliates(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.getAffiliates(w, r, user)
	case http.MethodPost:
		if !user.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		s.upsertAffiliate(w, r)
	case http.MethodPatch:
		if !user.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		s.upsertAffiliate(w, r)
	case http.MethodDelete:
		if !user.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		s.deleteAffiliate(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) affiliateCommissions(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.getAffiliateCommissions(w, r, user)
	case http.MethodPost:
		if !user.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		s.createAffiliateCommission(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) getAffiliates(w http.ResponseWriter, r *http.Request, user User) {
	ownerEmail := normalizeEmail(r.URL.Query().Get("owner_email"))
	if !user.IsAdmin {
		ownerEmail = normalizeEmail(user.Email)
	}

	if ownerEmail != "" {
		affiliate, err := s.ensureAffiliateByEmail(ownerEmail)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "affiliate not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to load affiliate")
			return
		}

		commissions, commissionSummary, err := s.listAffiliateCommissions(affiliate.ID, ownerEmail)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load commission")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"affiliate":  affiliate,
			"commissions": commissions,
			"summary": map[string]any{
				"affiliate_count":           1,
				"active_affiliates":         boolToInt(affiliate.Active),
				"total_commission_rupiah":   commissionSummary.TotalCommissionRupiah,
				"paid_commission_rupiah":    commissionSummary.PaidCommissionRupiah,
				"pending_commission_rupiah": commissionSummary.PendingCommissionRupiah,
				"commission_count":          len(commissions),
			},
		})
		return
	}

	if user.IsAdmin {
		affiliates, err := s.listAllAffiliates()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load affiliate")
			return
		}

		commissions, commissionSummary, err := s.listAllAffiliateCommissions("")
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load commission")
			return
		}

		activeCount := 0
		totalCommission := int64(0)
		for _, item := range affiliates {
			if item.Active {
				activeCount++
			}
			totalCommission += item.TotalCommissionRupiah
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"affiliates":  affiliates,
			"commissions": commissions,
			"summary": map[string]any{
				"affiliate_count":         len(affiliates),
				"active_affiliates":       activeCount,
				"total_commission_rupiah": totalCommission,
				"paid_commission_rupiah":  commissionSummary.PaidCommissionRupiah,
				"pending_commission_rupiah": commissionSummary.PendingCommissionRupiah,
				"commission_count":        len(commissions),
			},
		})
		return
	}

	affiliate, err := s.ensureAffiliateByEmail(normalizeEmail(user.Email))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load affiliate")
		return
	}

	commissions, commissionSummary, err := s.listAffiliateCommissions(affiliate.ID, affiliate.OwnerEmail)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load commission")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"affiliate":  affiliate,
		"commissions": commissions,
		"summary": map[string]any{
			"affiliate_count":           1,
			"active_affiliates":         boolToInt(affiliate.Active),
			"total_commission_rupiah":   commissionSummary.TotalCommissionRupiah,
			"paid_commission_rupiah":    commissionSummary.PaidCommissionRupiah,
			"pending_commission_rupiah": commissionSummary.PendingCommissionRupiah,
			"commission_count":          len(commissions),
		},
	})
}

func (s *server) getAffiliateCommissions(w http.ResponseWriter, r *http.Request, user User) {
	ownerEmail := normalizeEmail(r.URL.Query().Get("owner_email"))
	if !user.IsAdmin {
		ownerEmail = normalizeEmail(user.Email)
	}

	if ownerEmail == "" {
		writeJSON(w, http.StatusOK, map[string]any{"commissions": []affiliateCommissionItem{}})
		return
	}

	affiliate, err := s.ensureAffiliateByEmail(ownerEmail)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusOK, map[string]any{"commissions": []affiliateCommissionItem{}})
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load commission")
		return
	}

	commissions, _, err := s.listAffiliateCommissions(affiliate.ID, ownerEmail)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load commission")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"commissions": commissions})
}

type affiliateCommissionSummary struct {
	TotalCommissionRupiah   int64
	PaidCommissionRupiah    int64
	PendingCommissionRupiah int64
}

func (s *server) listAllAffiliates() ([]affiliateItem, error) {
	rows, err := s.db.Query(
		`SELECT a.id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        a.referral_code, a.coupon_code, a.commission_percent, a.coupon_discount_percent,
		        a.active, a.referred_signups, a.total_commission_rupiah, a.created_at, a.updated_at
		   FROM panel_affiliates a
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  ORDER BY a.created_at DESC, a.id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]affiliateItem, 0)
	for rows.Next() {
		item, err := scanAffiliateItem(rows, s.panelBaseURL)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (s *server) ensureAffiliateForUser(user User) (affiliateItem, error) {
	return s.ensureAffiliateByEmail(normalizeEmail(user.Email))
}

func (s *server) ensureAffiliateByEmail(ownerEmail string) (affiliateItem, error) {
	ownerEmail = normalizeEmail(ownerEmail)
	if ownerEmail == "" {
		return affiliateItem{}, sql.ErrNoRows
	}

	item, err := s.loadAffiliateByOwnerEmail(ownerEmail)
	if err == nil {
		return item, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return affiliateItem{}, err
	}

	user, err := s.loadUser(ownerEmail)
	if err != nil {
		return affiliateItem{}, err
	}

	for attempt := 0; attempt < 5; attempt++ {
		referralCode := generateAffiliateCode(user, "AFF")
		couponCode := generateAffiliateCode(user, "CPN")
		now := time.Now().UTC()
		_, err = s.db.Exec(
			`INSERT INTO panel_affiliates (
				owner_email, referral_code, coupon_code, commission_percent, coupon_discount_percent,
				active, referred_signups, total_commission_rupiah, created_at, updated_at
			) VALUES ($1, $2, $3, 10, 0, TRUE, 0, 0, $4, $5)`,
			ownerEmail,
			referralCode,
			couponCode,
			now,
			now,
		)
		if err == nil {
			return s.loadAffiliateByOwnerEmail(ownerEmail)
		}
		if !isUniqueViolation(err) {
			return affiliateItem{}, err
		}
	}

	return affiliateItem{}, errors.New("failed to create affiliate")
}

func (s *server) loadAffiliateByOwnerEmail(ownerEmail string) (affiliateItem, error) {
	var item affiliateItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT a.id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        a.referral_code, a.coupon_code, a.commission_percent, a.coupon_discount_percent,
		        a.active, a.referred_signups, a.total_commission_rupiah, a.created_at, a.updated_at
		   FROM panel_affiliates a
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  WHERE lower(a.owner_email) = lower($1)`,
		normalizeEmail(ownerEmail),
	).Scan(
		&item.ID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ReferralCode,
		&item.CouponCode,
		&item.CommissionPercent,
		&item.CouponDiscountPercent,
		&item.Active,
		&item.ReferredSignups,
		&item.TotalCommissionRupiah,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return affiliateItem{}, err
	}

	item.ReferralURL = buildAffiliateReferralURL(s.panelBaseURL, item.ReferralCode)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) loadAffiliateByID(id int64) (affiliateItem, error) {
	var item affiliateItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT a.id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        a.referral_code, a.coupon_code, a.commission_percent, a.coupon_discount_percent,
		        a.active, a.referred_signups, a.total_commission_rupiah, a.created_at, a.updated_at
		   FROM panel_affiliates a
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  WHERE a.id = $1`,
		id,
	).Scan(
		&item.ID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ReferralCode,
		&item.CouponCode,
		&item.CommissionPercent,
		&item.CouponDiscountPercent,
		&item.Active,
		&item.ReferredSignups,
		&item.TotalCommissionRupiah,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return affiliateItem{}, err
	}

	item.ReferralURL = buildAffiliateReferralURL(s.panelBaseURL, item.ReferralCode)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func scanAffiliateItem(scanner interface{ Scan(dest ...any) error }, baseURL string) (affiliateItem, error) {
	var item affiliateItem
	var createdAt time.Time
	var updatedAt time.Time
	if err := scanner.Scan(
		&item.ID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ReferralCode,
		&item.CouponCode,
		&item.CommissionPercent,
		&item.CouponDiscountPercent,
		&item.Active,
		&item.ReferredSignups,
		&item.TotalCommissionRupiah,
		&createdAt,
		&updatedAt,
	); err != nil {
		return affiliateItem{}, err
	}
	item.ReferralURL = buildAffiliateReferralURL(baseURL, item.ReferralCode)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func buildAffiliateReferralURL(baseURL, referralCode string) string {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = "https://panel.diworkin.com"
	}
	return fmt.Sprintf("%s/register?ref=%s", baseURL, url.QueryEscape(strings.TrimSpace(referralCode)))
}

func generateAffiliateCode(user User, prefix string) string {
	base := strings.ToUpper(strings.TrimSpace(prefix))
	if base == "" {
		base = "AFF"
	}
	namePart := sanitizeAffiliateToken(user.Name)
	if len(namePart) < 3 {
		namePart = sanitizeAffiliateToken(strings.SplitN(normalizeEmail(user.Email), "@", 2)[0])
	}
	if len(namePart) > 8 {
		namePart = namePart[:8]
	}
	token, err := randomToken(3)
	if err != nil {
		token = fmt.Sprintf("%x", time.Now().UnixNano())
	}
	token = strings.ToUpper(token)
	if len(token) > 8 {
		token = token[:8]
	}
	return strings.Trim(fmt.Sprintf("%s-%s-%s", base, namePart, token), "-")
}

func (s *server) loadAffiliateByCode(code string) (affiliateItem, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return affiliateItem{}, sql.ErrNoRows
	}

	var item affiliateItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT a.id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        a.referral_code, a.coupon_code, a.commission_percent, a.coupon_discount_percent,
		        a.active, a.referred_signups, a.total_commission_rupiah, a.created_at, a.updated_at
		   FROM panel_affiliates a
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  WHERE lower(a.referral_code) = lower($1) OR lower(a.coupon_code) = lower($1)
		  ORDER BY a.created_at DESC, a.id DESC
		  LIMIT 1`,
		code,
	).Scan(
		&item.ID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.ReferralCode,
		&item.CouponCode,
		&item.CommissionPercent,
		&item.CouponDiscountPercent,
		&item.Active,
		&item.ReferredSignups,
		&item.TotalCommissionRupiah,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return affiliateItem{}, err
	}

	item.ReferralURL = buildAffiliateReferralURL(s.panelBaseURL, item.ReferralCode)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) recordAffiliateReferral(email, referralCode, couponCode string) error {
	email = normalizeEmail(email)
	referralCode = strings.TrimSpace(referralCode)
	couponCode = strings.TrimSpace(couponCode)

	code := referralCode
	if code == "" {
		code = couponCode
	}
	if code == "" {
		return nil
	}

	affiliate, err := s.loadAffiliateByCode(code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}
		return err
	}

	_, err = s.db.Exec(
		`UPDATE panel_users
		    SET referrer_affiliate_id = $2,
		        affiliate_coupon_code = $3,
		        updated_at = NOW()
		  WHERE lower(email) = lower($1)`,
		email,
		affiliate.ID,
		couponCode,
	)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		`UPDATE panel_affiliates
		    SET referred_signups = referred_signups + 1,
		        updated_at = NOW()
		  WHERE id = $1`,
		affiliate.ID,
	)
	return err
}

func sanitizeAffiliateToken(value string) string {
	parts := strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r - 32
		case r >= 'A' && r <= 'Z':
			return r
		case r >= '0' && r <= '9':
			return r
		default:
			return '-'
		}
	}, strings.TrimSpace(value))
	parts = strings.Trim(parts, "-")
	parts = strings.ReplaceAll(parts, "--", "-")
	return parts
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func (s *server) upsertAffiliate(w http.ResponseWriter, r *http.Request) {
	var req affiliateRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	req.OwnerEmail = normalizeEmail(req.OwnerEmail)
	req.ReferralCode = strings.TrimSpace(req.ReferralCode)
	req.CouponCode = strings.TrimSpace(req.CouponCode)
	if req.OwnerEmail == "" {
		writeError(w, http.StatusBadRequest, "owner_email is required")
		return
	}

	if _, err := s.loadUser(req.OwnerEmail); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read user")
		return
	}

	if req.CommissionPercent <= 0 {
		req.CommissionPercent = 10
	}
	if req.CommissionPercent > 100 {
		req.CommissionPercent = 100
	}
	if req.CouponDiscountPercent < 0 {
		req.CouponDiscountPercent = 0
	}
	if req.CouponDiscountPercent > 100 {
		req.CouponDiscountPercent = 100
	}
	if req.ReferralCode == "" {
		req.ReferralCode = generateAffiliateCode(User{Email: req.OwnerEmail}, "AFF")
	}
	if req.CouponCode == "" {
		req.CouponCode = generateAffiliateCode(User{Email: req.OwnerEmail}, "CPN")
	}

	now := time.Now().UTC()
	var id int64
	err := s.db.QueryRow(
		`INSERT INTO panel_affiliates (
			owner_email, referral_code, coupon_code, commission_percent, coupon_discount_percent,
			active, updated_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE((SELECT created_at FROM panel_affiliates WHERE lower(owner_email) = lower($1) LIMIT 1), $8))
		ON CONFLICT (owner_email) DO UPDATE SET
			referral_code = EXCLUDED.referral_code,
			coupon_code = EXCLUDED.coupon_code,
			commission_percent = EXCLUDED.commission_percent,
			coupon_discount_percent = EXCLUDED.coupon_discount_percent,
			active = EXCLUDED.active,
			updated_at = NOW()
		RETURNING id`,
		req.OwnerEmail,
		req.ReferralCode,
		req.CouponCode,
		req.CommissionPercent,
		req.CouponDiscountPercent,
		req.Active,
		now,
		now,
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "affiliate code or coupon is already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save affiliate")
		return
	}

	item, err := s.loadAffiliateByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "affiliate saved, but failed to load details")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "saved",
		"message":   "Affiliate saved successfully.",
		"affiliate": item,
	})
}

func (s *server) deleteAffiliate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "affiliate id is required")
		return
	}

	result, err := s.db.Exec(`DELETE FROM panel_affiliates WHERE id = $1`, req.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete affiliate")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "affiliate not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Affiliate deleted successfully.",
	})
}

func (s *server) listAffiliateCommissions(affiliateID int64, ownerEmail string) ([]affiliateCommissionItem, affiliateCommissionSummary, error) {
	rows, err := s.db.Query(
		`SELECT c.id, c.affiliate_id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        c.source_email, c.source_invoice_number, c.amount_rupiah, c.commission_rupiah,
		        c.status, c.notes, c.created_at, c.updated_at
		   FROM panel_affiliate_commissions c
		   JOIN panel_affiliates a ON a.id = c.affiliate_id
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  WHERE c.affiliate_id = $1
		  ORDER BY c.created_at DESC, c.id DESC`,
		affiliateID,
	)
	if err != nil {
		return nil, affiliateCommissionSummary{}, err
	}
	defer rows.Close()

	items := make([]affiliateCommissionItem, 0)
	var summary affiliateCommissionSummary
	for rows.Next() {
		var item affiliateCommissionItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.AffiliateID,
			&item.OwnerEmail,
			&item.OwnerName,
			&item.Company,
			&item.SourceEmail,
			&item.SourceInvoiceNumber,
			&item.AmountRupiah,
			&item.CommissionRupiah,
			&item.Status,
			&item.Notes,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, affiliateCommissionSummary{}, err
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
		summary.TotalCommissionRupiah += item.CommissionRupiah
		switch strings.ToLower(strings.TrimSpace(item.Status)) {
		case "paid", "approved":
			summary.PaidCommissionRupiah += item.CommissionRupiah
		default:
			summary.PendingCommissionRupiah += item.CommissionRupiah
		}
	}

	if ownerEmail != "" {
		_ = ownerEmail
	}

	return items, summary, nil
}

func (s *server) listAllAffiliateCommissions(ownerEmail string) ([]affiliateCommissionItem, affiliateCommissionSummary, error) {
	query := `SELECT c.id, c.affiliate_id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        c.source_email, c.source_invoice_number, c.amount_rupiah, c.commission_rupiah,
		        c.status, c.notes, c.created_at, c.updated_at
		   FROM panel_affiliate_commissions c
		   JOIN panel_affiliates a ON a.id = c.affiliate_id
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)`
	args := []any{}
	if ownerEmail != "" {
		query += ` WHERE lower(a.owner_email) = lower($1)`
		args = append(args, normalizeEmail(ownerEmail))
	}
	query += ` ORDER BY c.created_at DESC, c.id DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, affiliateCommissionSummary{}, err
	}
	defer rows.Close()

	items := make([]affiliateCommissionItem, 0)
	var summary affiliateCommissionSummary
	for rows.Next() {
		var item affiliateCommissionItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.AffiliateID,
			&item.OwnerEmail,
			&item.OwnerName,
			&item.Company,
			&item.SourceEmail,
			&item.SourceInvoiceNumber,
			&item.AmountRupiah,
			&item.CommissionRupiah,
			&item.Status,
			&item.Notes,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, affiliateCommissionSummary{}, err
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
		summary.TotalCommissionRupiah += item.CommissionRupiah
		switch strings.ToLower(strings.TrimSpace(item.Status)) {
		case "paid", "approved":
			summary.PaidCommissionRupiah += item.CommissionRupiah
		default:
			summary.PendingCommissionRupiah += item.CommissionRupiah
		}
	}

	return items, summary, nil
}

func (s *server) createAffiliateCommission(w http.ResponseWriter, r *http.Request) {
	var req affiliateCommissionRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	req.OwnerEmail = normalizeEmail(req.OwnerEmail)
	req.SourceEmail = normalizeEmail(req.SourceEmail)
	req.SourceInvoiceNumber = strings.TrimSpace(req.SourceInvoiceNumber)
	req.Status = normalizeBillingStatus(req.Status)
	req.Notes = strings.TrimSpace(req.Notes)
	if req.Status == "" {
		req.Status = "pending"
	}
	if req.AffiliateID <= 0 && req.OwnerEmail == "" {
		writeError(w, http.StatusBadRequest, "affiliate_id or owner_email is required")
		return
	}

	var affiliate affiliateItem
	var err error
	if req.AffiliateID > 0 {
		affiliate, err = s.loadAffiliateByID(req.AffiliateID)
	} else {
		affiliate, err = s.ensureAffiliateByEmail(req.OwnerEmail)
	}
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "affiliate not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read affiliate")
		return
	}

	if req.CommissionRupiah <= 0 && req.AmountRupiah > 0 {
		req.CommissionRupiah = int64(math.Round(float64(req.AmountRupiah) * float64(affiliate.CommissionPercent) / 100.0))
	}
	if req.AmountRupiah < 0 {
		req.AmountRupiah = 0
	}
	if req.CommissionRupiah < 0 {
		req.CommissionRupiah = 0
	}

	now := time.Now().UTC()
	var commissionID int64
	err = s.db.QueryRow(
		`INSERT INTO panel_affiliate_commissions (
			affiliate_id, source_email, source_invoice_number, amount_rupiah, commission_rupiah,
			status, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
		affiliate.ID,
		req.SourceEmail,
		req.SourceInvoiceNumber,
		req.AmountRupiah,
		req.CommissionRupiah,
		req.Status,
		req.Notes,
		now,
		now,
	).Scan(&commissionID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save commission")
		return
	}

	if req.CommissionRupiah > 0 && (strings.EqualFold(req.Status, "paid") || strings.EqualFold(req.Status, "approved")) {
		_, _ = s.db.Exec(
			`UPDATE panel_affiliates SET total_commission_rupiah = total_commission_rupiah + $2, updated_at = NOW() WHERE id = $1`,
			affiliate.ID,
			req.CommissionRupiah,
		)
	}

	created, err := s.loadAffiliateCommissionByID(commissionID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "commission saved, but failed to load details")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":     "created",
		"message":    "Commission created successfully.",
		"commission": created,
	})
}

func (s *server) loadAffiliateCommissionByID(id int64) (affiliateCommissionItem, error) {
	var item affiliateCommissionItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT c.id, c.affiliate_id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        c.source_email, c.source_invoice_number, c.amount_rupiah, c.commission_rupiah,
		        c.status, c.notes, c.created_at, c.updated_at
		   FROM panel_affiliate_commissions c
		   JOIN panel_affiliates a ON a.id = c.affiliate_id
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  WHERE c.id = $1`,
		id,
	).Scan(
		&item.ID,
		&item.AffiliateID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.SourceEmail,
		&item.SourceInvoiceNumber,
		&item.AmountRupiah,
		&item.CommissionRupiah,
		&item.Status,
		&item.Notes,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return affiliateCommissionItem{}, err
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) settings(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.getSettings(w, sess)
	case http.MethodPatch:
		s.updateSettings(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) getSettings(w http.ResponseWriter, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	item, err := s.loadSettingsItem()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load settings")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"settings": item})
}

func (s *server) updateSettings(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeSettingsRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	current, err := s.loadSettingsItem()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load settings")
		return
	}

	req.BrandName = strings.TrimSpace(req.BrandName)
	req.LogoURL = strings.TrimSpace(req.LogoURL)
	req.LogoMarkURL = strings.TrimSpace(req.LogoMarkURL)
	req.BusinessHours = strings.TrimSpace(req.BusinessHours)
	req.Location = strings.TrimSpace(req.Location)
	req.OwnerName = strings.TrimSpace(req.OwnerName)
	req.OwnerPhone = strings.TrimSpace(req.OwnerPhone)
	req.OwnerWhatsApp = strings.TrimSpace(req.OwnerWhatsApp)
	req.BankName = strings.TrimSpace(req.BankName)
	req.BankAccountName = strings.TrimSpace(req.BankAccountName)
	req.BankAccountNumber = strings.TrimSpace(req.BankAccountNumber)
	req.BankBranch = strings.TrimSpace(req.BankBranch)
	req.BankNote = strings.TrimSpace(req.BankNote)

	if req.BrandName == "" {
		req.BrandName = current.BrandName
	}

	_, err = s.db.Exec(
		`UPDATE panel_settings
		 SET brand_name = $2,
		     logo_url = $3,
		     logo_mark_url = $4,
		     business_hours = $5,
		     location = $6,
		     owner_name = $7,
		     owner_phone = $8,
		     owner_whatsapp = $9,
		     bank_name = $10,
		     bank_account_name = $11,
		     bank_account_number = $12,
		     bank_branch = $13,
		     bank_note = $14,
		     updated_at = NOW()
		 WHERE id = $1`,
		current.ID,
		req.BrandName,
		req.LogoURL,
		req.LogoMarkURL,
		req.BusinessHours,
		req.Location,
		req.OwnerName,
		req.OwnerPhone,
		req.OwnerWhatsApp,
		req.BankName,
		req.BankAccountName,
		req.BankAccountNumber,
		req.BankBranch,
		req.BankNote,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save settings")
		return
	}

	item, err := s.loadSettingsItem()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "settings saved, but failed to reload")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "Settings updated successfully.",
		"settings": item,
	})
}

func (s *server) settingsUpload(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil || !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 12<<20)
	if err := r.ParseMultipartForm(12 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid upload payload")
		return
	}

	slot := strings.ToLower(strings.TrimSpace(r.FormValue("slot")))
	if slot != "logo" && slot != "logo_mark" {
		writeError(w, http.StatusBadRequest, "invalid slot")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	filename := strings.TrimSpace(r.FormValue("name"))
	if filename == "" && header != nil {
		filename = filepath.Base(header.Filename)
	}
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		ext = ".png"
	}
	if !isAllowedSettingsAssetExt(ext) {
		writeError(w, http.StatusBadRequest, "unsupported file format")
		return
	}

	dir := filepath.Join(defaultSettingsAssetRoot, slot)
	if err := os.MkdirAll(dir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to prepare upload folder")
		return
	}

	generated := fmt.Sprintf("%s-%d%s", slot, time.Now().UnixNano(), ext)
	targetPath := filepath.Join(dir, generated)
	out, err := os.Create(targetPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to upload file")
		return
	}

	publicURL := filepath.ToSlash(filepath.Join("/uploads/settings", slot, generated))
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "uploaded",
		"slot":   slot,
		"url":    publicURL,
		"name":   generated,
	})
}

func (s *server) loadSettingsItem() (settingsItem, error) {
	var item settingsItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT id, brand_name, logo_url, logo_mark_url, business_hours, location,
		        owner_name, owner_phone, owner_whatsapp,
		        bank_name, bank_account_name, bank_account_number, bank_branch, bank_note,
		        created_at, updated_at
		 FROM panel_settings
		 ORDER BY id ASC
		 LIMIT 1`,
	).Scan(
		&item.ID,
		&item.BrandName,
		&item.LogoURL,
		&item.LogoMarkURL,
		&item.BusinessHours,
		&item.Location,
		&item.OwnerName,
		&item.OwnerPhone,
		&item.OwnerWhatsApp,
		&item.BankName,
		&item.BankAccountName,
		&item.BankAccountNumber,
		&item.BankBranch,
		&item.BankNote,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_, insertErr := s.db.Exec(
				`INSERT INTO panel_settings (
					brand_name, logo_url, logo_mark_url, business_hours, location,
					owner_name, owner_phone, owner_whatsapp,
					bank_name, bank_account_name, bank_account_number, bank_branch, bank_note
				) VALUES (
					'Diworkin', '/diworkin-logo.png', '/diworkin-mark-dark.png', 'Senin - Jumat, 09:00 - 17:00', '',
					'Diworkin', '', '',
					'', '', '', '', ''
				)`)
			if insertErr != nil {
				return settingsItem{}, insertErr
			}
			return s.loadSettingsItem()
		}
		return settingsItem{}, err
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func isAllowedSettingsAssetExt(ext string) bool {
	switch strings.ToLower(ext) {
	case ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg":
		return true
	default:
		return false
	}
}

func decodeBillingRequest(w http.ResponseWriter, r *http.Request) (billingRequest, error) {
	var req billingRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		return billingRequest{}, errors.New("invalid JSON body")
	}
	req.InvoiceNumber = strings.TrimSpace(req.InvoiceNumber)
	req.PackageName = strings.TrimSpace(req.PackageName)
	req.CustomerName = strings.TrimSpace(req.CustomerName)
	req.CustomerEmail = strings.TrimSpace(req.CustomerEmail)
	req.Domain = strings.TrimSpace(req.Domain)
	req.BillingCycle = strings.ToLower(strings.TrimSpace(req.BillingCycle))
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	req.Notes = strings.TrimSpace(req.Notes)
	if req.BillingCycle == "" {
		req.BillingCycle = "monthly"
	}
	if req.Status == "" {
		req.Status = "pending"
	}
	return req, nil
}

func decodeLicenseRequest(w http.ResponseWriter, r *http.Request) (licenseRequest, error) {
	var req licenseRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		return licenseRequest{}, errors.New("invalid JSON body")
	}

	req.OwnerEmail = strings.TrimSpace(req.OwnerEmail)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Domain = strings.TrimSpace(req.Domain)
	req.LicenseKey = strings.TrimSpace(req.LicenseKey)
	req.LicenseType = strings.ToLower(strings.TrimSpace(req.LicenseType))
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	req.Notes = strings.TrimSpace(req.Notes)
	return req, nil
}

func decodeLicenseVerifyRequest(w http.ResponseWriter, r *http.Request) (licenseVerifyRequest, error) {
	var req licenseVerifyRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		return licenseVerifyRequest{}, errors.New("invalid JSON body")
	}

	req.LicenseKey = strings.TrimSpace(req.LicenseKey)
	req.Domain = strings.TrimSpace(req.Domain)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.LicenseType = strings.ToLower(strings.TrimSpace(req.LicenseType))
	return req, nil
}

func decodeSettingsRequest(w http.ResponseWriter, r *http.Request) (settingsRequest, error) {
	var req settingsRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		return settingsRequest{}, errors.New("invalid JSON body")
	}

	req.BrandName = strings.TrimSpace(req.BrandName)
	req.LogoURL = strings.TrimSpace(req.LogoURL)
	req.LogoMarkURL = strings.TrimSpace(req.LogoMarkURL)
	req.BusinessHours = strings.TrimSpace(req.BusinessHours)
	req.Location = strings.TrimSpace(req.Location)
	req.OwnerName = strings.TrimSpace(req.OwnerName)
	req.OwnerPhone = strings.TrimSpace(req.OwnerPhone)
	req.OwnerWhatsApp = strings.TrimSpace(req.OwnerWhatsApp)
	req.BankName = strings.TrimSpace(req.BankName)
	req.BankAccountName = strings.TrimSpace(req.BankAccountName)
	req.BankAccountNumber = strings.TrimSpace(req.BankAccountNumber)
	req.BankBranch = strings.TrimSpace(req.BankBranch)
	req.BankNote = strings.TrimSpace(req.BankNote)
	return req, nil
}

func normalizeBillingCycle(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "monthly", "quarterly", "yearly", "lifetime", "custom":
		return strings.ToLower(strings.TrimSpace(value))
	case "":
		return "monthly"
	default:
		return ""
	}
}

func normalizeBillingStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "draft", "pending", "sent", "paid", "overdue", "canceled":
		return strings.ToLower(strings.TrimSpace(value))
	case "":
		return "pending"
	default:
		return ""
	}
}

func normalizeLicenseType(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "panel"
	}
	return value
}

func normalizeLicenseStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "active", "inactive", "suspended", "expired", "revoked", "draft":
		return strings.ToLower(strings.TrimSpace(value))
	case "":
		return "active"
	default:
		return ""
	}
}

func parseOptionalBillingTime(value string) (sql.NullTime, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return sql.NullTime{}, nil
	}
	t, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return sql.NullTime{}, err
	}
	return sql.NullTime{Time: t.UTC(), Valid: true}, nil
}

func parseOptionalLicenseTime(value string) (sql.NullTime, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return sql.NullTime{}, nil
	}
	t, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return sql.NullTime{}, err
	}
	return sql.NullTime{Time: t.UTC(), Valid: true}, nil
}

func nullTimePtr(value sql.NullTime) any {
	if !value.Valid {
		return nil
	}
	return value.Time.UTC()
}

func generateLicenseKey() string {
	token, err := randomToken(16)
	if err != nil {
		token = fmt.Sprintf("%d", time.Now().UnixNano())
	}
	token = strings.ToUpper(strings.ReplaceAll(token, "-", ""))
	if len(token) < 16 {
		token += strings.Repeat("X", 16-len(token))
	}

	chunks := make([]string, 0, 4)
	for index := 0; index < 16; index += 4 {
		end := index + 4
		if end > len(token) {
			end = len(token)
		}
		chunks = append(chunks, token[index:end])
	}
	return "LIC-" + strings.Join(chunks, "-")
}

func generateBillingInvoiceNumber() string {
	prefix := time.Now().UTC().Format("20060102")
	suffix, err := randomToken(3)
	if err != nil {
		suffix = "000000"
	}
	return fmt.Sprintf("INV-%s-%s", prefix, strings.ToUpper(suffix))
}

func (s *server) domains(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listDomains(w, sess)
	case http.MethodPost:
		s.addDomain(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listDomains(w http.ResponseWriter, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT owner_email, domain, project_name, app_type, public_path, wordpress_admin_user, (wordpress_admin_pass_enc <> '') AS wordpress_access_ready, created_at, updated_at, provisioned_at
		FROM panel_domains`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, normalizeEmail(sess.Email))
	}
	query += ` ORDER BY created_at DESC, domain ASC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load domains")
		return
	}
	defer rows.Close()

	items := make([]domainItem, 0)
	for rows.Next() {
		var item domainItem
		var createdAt time.Time
		var updatedAt time.Time
		var provisionedAt time.Time

		if err := rows.Scan(&item.OwnerEmail, &item.Domain, &item.ProjectName, &item.AppType, &item.PublicPath, &item.WordPressAdminUser, &item.WordPressAccessReady, &createdAt, &updatedAt, &provisionedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read domains")
			return
		}

		item.ServerIP = s.serverIP()
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		item.ProvisionedAt = provisionedAt.Format(time.RFC3339)
		item.Nameservers = panelNameservers()
		item.DNSStatus = "unknown"
		item.SiteStatus = "unknown"

		if ok, _, err := s.domainDelegationReady(item.Domain); err == nil && ok {
			item.DNSStatus = "ready"
		} else if err == nil {
			item.DNSStatus = "pending"
		} else {
			item.DNSStatus = "pending"
		}

		if item.DNSStatus == "ready" {
			if reachable, err := s.domainSiteLive(item.Domain); err == nil && reachable {
				item.SiteStatus = "live"
			} else {
				item.SiteStatus = "offline"
			}
		} else {
			item.SiteStatus = "waiting_dns"
		}

		if strings.EqualFold(item.AppType, "wordpress") {
			item.WordPressFilesystemMode = s.wordpressFilesystemMode(item.PublicPath)
		}

		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"domains": items})
}

func (s *server) addDomain(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDomainRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	if !isValidDomainName(req.Domain) {
		writeError(w, http.StatusBadRequest, "invalid domain format")
		return
	}

	if existing, _ := s.domainExists(req.Domain); existing {
		writeError(w, http.StatusConflict, "domain already exists")
		return
	}

	ready, nsList, err := s.domainDelegationReady(req.Domain)
	if err != nil || !ready {
		writeError(w, http.StatusConflict, fmt.Sprintf("point the domain nameservers to %s and %s first", nsList[0], nsList[1]))
		return
	}

	publicPath := s.domainPublicPath(req.Domain)
	if err := s.provisionDomain(req.Domain, req.ProjectName, user.Email, publicPath); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := s.saveDomain(req.Domain, req.ProjectName, "plain", user.Email, publicPath); err != nil {
		_ = s.cleanupDomain(req.Domain, publicPath)
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "domain already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save domain")
		return
	}

	if err := s.enableDomainHTTPS(req.Domain, user.Email, publicPath); err != nil {
		log.Printf("domain https warning for %s: %v", req.Domain, err)
	}

	item, err := s.loadDomainItem(req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "domain created, but failed to load details")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "Domain added and DNS provisioned successfully.",
		"domain":  item,
	})
}

func (s *server) updateDomain(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost && r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDomainRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	var ownerEmail string
	var publicPath string
	err = s.db.QueryRow(
		`SELECT owner_email, public_path FROM panel_domains WHERE lower(domain) = lower($1)`,
		normalizeDomain(req.Domain),
	).Scan(&ownerEmail, &publicPath)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "domain not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read domain")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	result, err := s.db.Exec(
		`UPDATE panel_domains
		 SET project_name = $2, updated_at = NOW()
		 WHERE lower(domain) = lower($1)`,
		normalizeDomain(req.Domain),
		strings.TrimSpace(req.ProjectName),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update domain")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "domain not found")
		return
	}

	if err := s.provisionDomain(normalizeDomain(req.Domain), req.ProjectName, ownerEmail, publicPath); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := s.enableDomainHTTPS(req.Domain, ownerEmail, publicPath); err != nil {
		log.Printf("domain https warning for %s: %v", req.Domain, err)
	}

	item, err := s.loadDomainItem(req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load domain")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "Project name updated successfully.",
		"domain":  item,
	})
}

func (s *server) domainCheck(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	domain := normalizeDomain(r.URL.Query().Get("domain"))
	if domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	item, err := s.loadDomainItem(domain)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "domain not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load domain")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	if !user.IsAdmin && normalizeEmail(item.OwnerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	writeJSON(w, http.StatusOK, domainCheckResponse{
		Domain:      item.Domain,
		DNSStatus:   item.DNSStatus,
		SiteStatus:  item.SiteStatus,
		Nameservers: item.Nameservers,
		ServerIP:    item.ServerIP,
	})
}

func (s *server) dnsDomains(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	type dnsDomain struct {
		Domain      string `json:"domain"`
		DisplayName string `json:"display_name"`
		OwnerEmail  string `json:"owner_email"`
	}

	items := make([]dnsDomain, 0)

	query := `SELECT owner_email, domain, project_name
		FROM panel_domains`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, normalizeEmail(sess.Email))
	}
	query += ` ORDER BY created_at DESC, domain ASC`

	rows, err := s.db.Query(query, args...)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var ownerEmail, domain, projectName string
			if err := rows.Scan(&ownerEmail, &domain, &projectName); err != nil {
				writeError(w, http.StatusInternalServerError, "failed to read domains")
				return
			}

			display := domain
			if projectName != "" {
				display = fmt.Sprintf("%s (%s)", domain, projectName)
			}

			items = append(items, dnsDomain{
				Domain:      domain,
				DisplayName: display,
				OwnerEmail:  ownerEmail,
			})
		}
	}

	if len(items) == 0 && user.IsAdmin {
		output, err := exec.Command("pdnsutil", "list-all-zones").CombinedOutput()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load domains")
			return
		}

		seen := make(map[string]struct{})
		for _, line := range strings.Split(string(output), "\n") {
			domain := normalizeDomain(line)
			if domain == "" {
				continue
			}
			if _, ok := seen[domain]; ok {
				continue
			}
			seen[domain] = struct{}{}
			items = append(items, dnsDomain{
				Domain:      domain,
				DisplayName: domain,
			})
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"domains": items})
}

func (s *server) dnsRecords(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listDNSRecords(w, r, sess)
	case http.MethodPost:
		s.createDNSRecord(w, r, sess)
	case http.MethodPatch:
		s.updateDNSRecord(w, r, sess)
	case http.MethodDelete:
		s.deleteDNSRecord(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) databases(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listDatabases(w, r, sess)
	case http.MethodPost:
		s.createDatabase(w, r, sess)
	case http.MethodDelete:
		s.deleteDatabase(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) databaseEngines(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	_ = sess
	engines := []databaseEngineItem{
		{Key: "postgres", Label: "PostgreSQL", Supported: commandAvailable("createdb") && commandAvailable("psql"), Note: "Recommended for panel apps"},
		{Key: "mariadb", Label: "MariaDB", Supported: commandAvailable("mysql") || commandAvailable("mariadb"), Note: "MySQL-compatible"},
		{Key: "mongodb", Label: "MongoDB", Supported: commandAvailable("mongosh") || commandAvailable("mongo"), Note: "Document database"},
	}

	writeJSON(w, http.StatusOK, map[string]any{"engines": engines})
}

func (s *server) listDatabases(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	domainFilter := normalizeDomain(r.URL.Query().Get("domain"))
	if domainFilter != "" {
		allowed, err := s.canManagePanelDomain(user, domainFilter)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	query := `SELECT owner_email, domain, engine, name, username, connection_uri, host, port, status, created_at, updated_at
		FROM panel_databases`
	args := []any{}
	if domainFilter != "" {
		query += ` WHERE lower(domain) = lower($1)`
		args = append(args, domainFilter)
	} else if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, normalizeEmail(sess.Email))
	}
	query += ` ORDER BY created_at DESC, engine ASC, name ASC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load databases")
		return
	}
	defer rows.Close()

	items := make([]databaseItem, 0)
	for rows.Next() {
		var item databaseItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&item.OwnerEmail, &item.Domain, &item.Engine, &item.Name, &item.Username, &item.ConnectionURI, &item.Host, &item.Port, &item.Status, &createdAt, &updatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read databases")
			return
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"databases": items})
}

func (s *server) createDatabase(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDatabaseRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" || req.Engine == "" || req.Name == "" || req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "domain, engine, name, username, and password are required")
		return
	}

	if !isValidDomainName(req.Domain) {
		writeError(w, http.StatusBadRequest, "invalid domain format")
		return
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	engine := strings.ToLower(strings.TrimSpace(req.Engine))
	if !isSupportedDatabaseEngine(engine) {
		writeError(w, http.StatusBadRequest, "database engine is not supported")
		return
	}

	dbName := normalizeDatabaseIdentifier(req.Name)
	dbUser := normalizeDatabaseIdentifier(req.Username)
	if !isValidDatabaseIdentifier(dbName) || !isValidDatabaseIdentifier(dbUser) {
		writeError(w, http.StatusBadRequest, "database name and username can only contain letters, numbers, and underscores")
		return
	}

	exists, err := s.databaseExists(engine, dbName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check database")
		return
	}
	if exists {
		writeError(w, http.StatusConflict, "database is already registered")
		return
	}

	host := "127.0.0.1"
	port := databaseEnginePort(engine)
	connectionURI := databaseConnectionURI(engine, host, port, dbName, dbUser, req.Password)

	if err := s.provisionDatabase(engine, dbName, dbUser, req.Password); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	_, err = s.db.Exec(
		`INSERT INTO panel_databases (owner_email, domain, engine, name, username, connection_uri, host, port, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
		normalizeEmail(sess.Email),
		normalizeDomain(req.Domain),
		engine,
		dbName,
		dbUser,
		connectionURI,
		host,
		port,
	)
	if err != nil {
		_ = s.removeProvisionedDatabase(engine, dbName, dbUser)
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "database is already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save database")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "Database created successfully.",
	})
}

func (s *server) deleteDatabase(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDatabaseRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	engine := strings.ToLower(strings.TrimSpace(req.Engine))
	dbName := normalizeDatabaseIdentifier(req.Name)
	if req.Domain == "" || engine == "" || dbName == "" {
		writeError(w, http.StatusBadRequest, "domain, engine, and name are required")
		return
	}

	var ownerEmail string
	var username string
	err = s.db.QueryRow(
		`SELECT owner_email, username FROM panel_databases WHERE lower(domain) = lower($1) AND engine = $2 AND name = $3`,
		normalizeDomain(req.Domain),
		engine,
		dbName,
	).Scan(&ownerEmail, &username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "database not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read database")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if err := s.removeProvisionedDatabase(engine, dbName, username); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_databases WHERE lower(domain) = lower($1) AND engine = $2 AND name = $3`, normalizeDomain(req.Domain), engine, dbName); err != nil {
		writeError(w, http.StatusInternalServerError, "database cleaned up, but failed to delete data")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Database deleted successfully.",
	})
}

func (s *server) studioDatabases(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT owner_email, domain, engine, name, username, host, port, status
		FROM panel_databases`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, normalizeEmail(sess.Email))
	}
	query += ` ORDER BY created_at DESC, engine ASC, name ASC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load databases")
		return
	}
	defer rows.Close()

	items := make([]studioDatabaseItem, 0)
	for rows.Next() {
		var item studioDatabaseItem
		var ownerEmail string
		if err := rows.Scan(&ownerEmail, &item.Domain, &item.Engine, &item.Name, &item.Username, &item.Host, &item.Port, &item.Status); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read databases")
			return
		}
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"databases": items})
}

func (s *server) studioObjects(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dbItem, err := s.loadStudioDatabaseFromRequest(r, sess)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	switch dbItem.Engine {
	case "postgres", "mariadb":
		sqlDB, closeFn, err := s.openSQLDatabase(dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer closeFn()

		items, err := listSQLObjects(r.Context(), sqlDB, dbItem.Engine)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"database": dbItem, "objects": items})
	case "mongodb":
		client, err := s.openMongoClient(r.Context(), dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer func() { _ = client.Disconnect(r.Context()) }()

		items, err := listMongoObjects(r.Context(), client, dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"database": dbItem, "objects": items})
	default:
		writeError(w, http.StatusBadRequest, "database engine is not supported")
	}
}

func (s *server) studioRows(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listStudioRows(w, r, sess)
	case http.MethodPost:
		s.createStudioRow(w, r, sess)
	case http.MethodPatch:
		s.updateStudioRow(w, r, sess)
	case http.MethodDelete:
		s.deleteStudioRow(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) loadStudioDatabaseMeta(domain, engine, name string, sess sessionRow) (databaseItem, error) {
	var item databaseItem
	err := s.db.QueryRow(
		`SELECT owner_email, domain, engine, name, username, connection_uri, host, port, status
		 FROM panel_databases
		 WHERE lower(domain) = lower($1) AND lower(engine) = lower($2) AND lower(name) = lower($3)`,
		normalizeDomain(domain),
		strings.ToLower(strings.TrimSpace(engine)),
		normalizeDatabaseIdentifier(name),
	).Scan(&item.OwnerEmail, &item.Domain, &item.Engine, &item.Name, &item.Username, &item.ConnectionURI, &item.Host, &item.Port, &item.Status)
	if err != nil {
		return databaseItem{}, err
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		return databaseItem{}, err
	}
	if !user.IsAdmin && normalizeEmail(item.OwnerEmail) != normalizeEmail(sess.Email) {
		return databaseItem{}, sql.ErrNoRows
	}

	return item, nil
}

func (s *server) loadStudioDatabaseFromRequest(r *http.Request, sess sessionRow) (databaseItem, error) {
	domain := normalizeDomain(r.URL.Query().Get("domain"))
	engine := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("engine")))
	name := normalizeDatabaseIdentifier(r.URL.Query().Get("name"))
	if domain == "" || engine == "" || name == "" {
		return databaseItem{}, errors.New("domain, engine, and name are required")
	}

	return s.loadStudioDatabaseMeta(domain, engine, name, sess)
}

func (s *server) openSQLDatabase(item databaseItem) (*sql.DB, func(), error) {
	conn, err := sqlDatabaseDSN(item.Engine, item.ConnectionURI)
	if err != nil {
		return nil, nil, err
	}

	driver := "pgx"
	if item.Engine == "mariadb" {
		driver = "mysql"
	}

	dbConn, err := sql.Open(driver, conn)
	if err != nil {
		return nil, nil, err
	}
	dbConn.SetConnMaxLifetime(5 * time.Minute)
	dbConn.SetMaxOpenConns(4)
	dbConn.SetMaxIdleConns(2)
	if err := dbConn.Ping(); err != nil {
		_ = dbConn.Close()
		return nil, nil, err
	}

	return dbConn, func() { _ = dbConn.Close() }, nil
}

func sqlDatabaseDSN(engine, connectionURI string) (string, error) {
	parsed, err := url.Parse(connectionURI)
	if err != nil {
		return "", err
	}

	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		return connectionURI, nil
	case "mariadb":
		user := ""
		pass := ""
		if parsed.User != nil {
			user = parsed.User.Username()
			pass, _ = parsed.User.Password()
		}
		cfg := mysql.Config{
			User:                 user,
			Passwd:               pass,
			Net:                  "tcp",
			Addr:                 parsed.Host,
			DBName:               strings.TrimPrefix(parsed.Path, "/"),
			AllowNativePasswords: true,
			ParseTime:            true,
			Loc:                  time.UTC,
		}
		return cfg.FormatDSN(), nil
	default:
		return "", errors.New("database engine is not supported")
	}
}

func (s *server) openMongoClient(ctx context.Context, item databaseItem) (*mongo.Client, error) {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(item.ConnectionURI))
	if err != nil {
		return nil, err
	}
	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(ctx)
		return nil, err
	}
	return client, nil
}

func listSQLObjects(ctx context.Context, dbConn *sql.DB, engine string) ([]studioObjectItem, error) {
	query := `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'`
	args := []any{}
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		query += ` AND table_schema = 'public'`
	case "mariadb":
		query += ` AND table_schema = DATABASE()`
	default:
		return nil, errors.New("database engine is not supported")
	}
	query += ` ORDER BY table_name ASC`

	rows, err := dbConn.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]studioObjectItem, 0)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		items = append(items, studioObjectItem{Name: name, Type: "table"})
	}
	return items, nil
}

func listMongoObjects(ctx context.Context, client *mongo.Client, item databaseItem) ([]studioObjectItem, error) {
	databaseName := mongoDatabaseName(item.ConnectionURI, item.Name)
	if databaseName == "" {
		databaseName = item.Name
	}
	names, err := client.Database(databaseName).ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	items := make([]studioObjectItem, 0, len(names))
	for _, name := range names {
		items = append(items, studioObjectItem{Name: name, Type: "collection"})
	}
	return items, nil
}

func (s *server) listStudioRows(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	dbItem, err := s.loadStudioDatabaseFromRequest(r, sess)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	objectName := strings.TrimSpace(r.URL.Query().Get("object"))
	if objectName == "" {
		writeError(w, http.StatusBadRequest, "object is required")
		return
	}

	limit := 50
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	offset := 0
	if raw := strings.TrimSpace(r.URL.Query().Get("offset")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	switch dbItem.Engine {
	case "postgres", "mariadb":
		sqlDB, closeFn, err := s.openSQLDatabase(dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer closeFn()

		rowsResp, err := readSQLRows(r.Context(), sqlDB, dbItem, objectName, limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, rowsResp)
	case "mongodb":
		client, err := s.openMongoClient(r.Context(), dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer func() { _ = client.Disconnect(r.Context()) }()

		rowsResp, err := readMongoRows(r.Context(), client, dbItem, objectName, limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, rowsResp)
	default:
		writeError(w, http.StatusBadRequest, "database engine is not supported")
	}
}

func (s *server) createStudioRow(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	s.writeStudioMutation(w, r, sess, "insert")
}

func (s *server) updateStudioRow(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	s.writeStudioMutation(w, r, sess, "update")
}

func (s *server) deleteStudioRow(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	s.writeStudioMutation(w, r, sess, "delete")
}

func (s *server) fileManager(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		if strings.EqualFold(strings.TrimSpace(r.URL.Query().Get("mode")), "content") {
			s.readFileManagerContent(w, r, sess)
			return
		}
		s.browseFiles(w, r, sess)
	case http.MethodPost:
		if strings.HasPrefix(strings.ToLower(strings.TrimSpace(r.Header.Get("Content-Type"))), "multipart/form-data") {
			s.uploadFileManagerItem(w, r, sess)
			return
		}
		s.createFileManagerItem(w, r, sess)
	case http.MethodPatch:
		s.updateFileManagerItem(w, r, sess)
	case http.MethodDelete:
		s.deleteFileManagerItem(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) readFileManagerContent(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	domain := normalizeDomain(r.URL.Query().Get("domain"))
	path := cleanFileManagerPath(r.URL.Query().Get("path"))
	if domain == "" || path == "" {
		writeError(w, http.StatusBadRequest, "domain and path are required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	allowed, err := s.canManagePanelDomain(user, domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	content, err := s.readFileContent(domain, path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			writeError(w, http.StatusNotFound, "file not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, content)
}

func (s *server) browseFiles(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	domain := normalizeDomain(r.URL.Query().Get("domain"))
	if domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	allowed, err := s.canManagePanelDomain(user, domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	path := strings.TrimSpace(r.URL.Query().Get("path"))
	basePath, absPath, relPath, err := s.resolveDomainFilePath(domain, path)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	info, err := os.Stat(absPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "path not found")
		return
	}
	if !info.IsDir() {
		writeError(w, http.StatusBadRequest, "path must be a folder")
		return
	}

	entries, err := os.ReadDir(absPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read folder")
		return
	}

	items := make([]fileManagerItem, 0, len(entries))
	for _, entry := range entries {
		entryInfo, err := entry.Info()
		if err != nil {
			continue
		}

		itemRelPath := filepath.ToSlash(filepath.Join(relPath, entry.Name()))
		if relPath == "" {
			itemRelPath = entry.Name()
		}

		itemType := "file"
		if entry.IsDir() {
			itemType = "dir"
		}

		items = append(items, fileManagerItem{
			Name:      entry.Name(),
			Path:      itemRelPath,
			Type:      itemType,
			Size:      entryInfo.Size(),
			ModTime:   entryInfo.ModTime().Format(time.RFC3339),
			Extension: strings.TrimPrefix(strings.ToLower(filepath.Ext(entry.Name())), "."),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].Type != items[j].Type {
			return items[i].Type == "dir"
		}
		return strings.ToLower(items[i].Name) < strings.ToLower(items[j].Name)
	})

	parentPath := ""
	if relPath != "" {
		parentPath = filepath.ToSlash(filepath.Dir(relPath))
		if parentPath == "." {
			parentPath = ""
		}
	}

	writeJSON(w, http.StatusOK, fileManagerBrowseResponse{
		Domain:     domain,
		PublicPath: basePath,
		CurrentPath: filepath.ToSlash(relPath),
		ParentPath: parentPath,
		Items:      items,
	})
}

func (s *server) createFileManagerItem(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	req, err := decodeFileManagerRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	basePath, absPath, _, err := s.resolveDomainFilePath(req.Domain, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if !isValidFileName(name) {
		writeError(w, http.StatusBadRequest, "file or folder name is invalid")
		return
	}

	targetPath, err := resolveChildPath(basePath, absPath, name)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	kind := strings.ToLower(strings.TrimSpace(req.Kind))
	browsePath := absPath
	switch kind {
	case "dir", "folder":
		if err := os.MkdirAll(targetPath, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create folder")
			return
		}
	case "file", "":
		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to prepare folder")
			return
		}
		if err := os.WriteFile(targetPath, []byte(req.Content), 0644); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create file")
			return
		}
		browsePath = filepath.Dir(targetPath)
	default:
		writeError(w, http.StatusBadRequest, "kind must be file or folder")
		return
	}

	s.writeFileManagerBrowse(w, req.Domain, browsePath)
}

func (s *server) uploadFileManagerItem(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	r.Body = http.MaxBytesReader(w, r.Body, 64<<20)
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid upload payload")
		return
	}

	domain := normalizeDomain(r.FormValue("domain"))
	if domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	allowed, err := s.canManagePanelDomain(user, domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	basePath, absPath, _, err := s.resolveDomainFilePath(domain, cleanFileManagerPath(r.FormValue("path")))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	info, err := os.Stat(absPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "destination folder not found")
		return
	}
	if !info.IsDir() {
		writeError(w, http.StatusBadRequest, "upload path must be a folder")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	name := strings.TrimSpace(r.FormValue("name"))
	if name == "" && header != nil {
		name = filepath.Base(header.Filename)
	}
	if !isValidFileName(name) {
		writeError(w, http.StatusBadRequest, "file name is invalid")
		return
	}

	targetPath, err := resolveChildPath(basePath, absPath, name)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to prepare destination folder")
		return
	}

	out, err := os.Create(targetPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to write file")
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to upload file")
		return
	}

	s.writeFileManagerBrowse(w, domain, filepath.Dir(targetPath))
}

func (s *server) updateFileManagerItem(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	req, err := decodeFileManagerRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	basePath, absPath, _, err := s.resolveDomainFilePath(req.Domain, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	kind := strings.ToLower(strings.TrimSpace(req.Kind))
	switch kind {
	case "rename":
		newName := strings.TrimSpace(req.NewName)
		if newName == "" {
			writeError(w, http.StatusBadRequest, "new_name is required")
			return
		}
		if !isValidFileName(newName) {
			writeError(w, http.StatusBadRequest, "new name is invalid")
			return
		}
		targetPath, err := resolveChildPath(basePath, filepath.Dir(absPath), newName)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if err := os.Rename(absPath, targetPath); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to rename file")
			return
		}
		s.writeFileManagerBrowse(w, req.Domain, filepath.Dir(targetPath))
	case "file", "save", "":
		info, err := os.Stat(absPath)
		if err != nil {
			writeError(w, http.StatusNotFound, "file not found")
			return
		}
		if info.IsDir() {
			writeError(w, http.StatusBadRequest, "path must be a file")
			return
		}
		if err := os.WriteFile(absPath, []byte(req.Content), 0644); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to save file")
			return
		}
		contentResp, err := s.readFileContent(req.Domain, req.Path)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"status": "saved", "file": contentResp})
	default:
		writeError(w, http.StatusBadRequest, "kind is not supported")
	}
}

func (s *server) deleteFileManagerItem(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	req, err := decodeFileManagerRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	basePath, absPath, _, err := s.resolveDomainFilePath(req.Domain, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if absPath == basePath {
		writeError(w, http.StatusBadRequest, "root folder cannot be deleted")
		return
	}

	info, err := os.Stat(absPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "path not found")
		return
	}

	if info.IsDir() {
		if err := os.RemoveAll(absPath); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete folder")
			return
		}
	} else if err := os.Remove(absPath); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete file")
		return
	}

	s.writeFileManagerBrowse(w, req.Domain, filepath.Dir(absPath))
}

func (s *server) readFileContent(domain, relPath string) (fileManagerContentResponse, error) {
	basePath, err := s.fileManagerTargetPublicPath(domain)
	if err != nil {
		return fileManagerContentResponse{}, err
	}
	_, absPath, _, err := s.resolveTargetPathFromBase(basePath, relPath)
	if err != nil {
		return fileManagerContentResponse{}, err
	}

	info, err := os.Stat(absPath)
	if err != nil {
		return fileManagerContentResponse{}, err
	}
	if info.IsDir() {
		return fileManagerContentResponse{}, errors.New("path must be a file")
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		return fileManagerContentResponse{}, err
	}
	isBinary := bytes.IndexByte(data, 0) >= 0
	content := string(data)
	if isBinary {
		content = ""
	}

	return fileManagerContentResponse{
		Domain:   normalizeDomain(domain),
		Path:     filepath.ToSlash(strings.TrimPrefix(strings.TrimPrefix(relPath, "/"), ".")),
		Content:  content,
		Size:     info.Size(),
		ModTime:  info.ModTime().Format(time.RFC3339),
		IsBinary: isBinary,
	}, nil
}

func (s *server) writeFileManagerBrowse(w http.ResponseWriter, domain, absPath string) {
	baseAbsPath, err := s.fileManagerTargetPublicPath(domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load file targets manager")
		return
	}

	relPath, err := filepath.Rel(baseAbsPath, absPath)
	if err != nil {
		relPath = ""
	}
	relPath = strings.TrimPrefix(filepath.ToSlash(relPath), "./")
	if relPath == "." {
		relPath = ""
	}
	info, err := os.Stat(absPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "path not found")
		return
	}
	if !info.IsDir() {
		writeError(w, http.StatusBadRequest, "path must be a folder")
		return
	}
	entries, err := os.ReadDir(absPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read folder")
		return
	}

	items := make([]fileManagerItem, 0, len(entries))
	for _, entry := range entries {
		entryInfo, err := entry.Info()
		if err != nil {
			continue
		}

		childRel := filepath.ToSlash(filepath.Join(relPath, entry.Name()))
		if relPath == "" {
			childRel = entry.Name()
		}

		itemType := "file"
		if entry.IsDir() {
			itemType = "dir"
		}

		items = append(items, fileManagerItem{
			Name:      entry.Name(),
			Path:      childRel,
			Type:      itemType,
			Size:      entryInfo.Size(),
			ModTime:   entryInfo.ModTime().Format(time.RFC3339),
			Extension: strings.TrimPrefix(strings.ToLower(filepath.Ext(entry.Name())), "."),
		})
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].Type != items[j].Type {
			return items[i].Type == "dir"
		}
		return strings.ToLower(items[i].Name) < strings.ToLower(items[j].Name)
	})

	parentPath := ""
	if relPath != "" {
		parentPath = filepath.ToSlash(filepath.Dir(relPath))
		if parentPath == "." {
			parentPath = ""
		}
	}

	writeJSON(w, http.StatusOK, fileManagerBrowseResponse{
		Domain:      normalizeDomain(domain),
		PublicPath:  baseAbsPath,
		CurrentPath: relPath,
		ParentPath:  parentPath,
		Items:       items,
	})
}

func (s *server) writeStudioMutation(w http.ResponseWriter, r *http.Request, sess sessionRow, mode string) {
	var req studioWriteRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Object == "" {
		req.Object = r.URL.Query().Get("object")
	}
	req.Object = strings.TrimSpace(req.Object)

	domain := normalizeDomain(r.URL.Query().Get("domain"))
	if domain == "" {
		domain = normalizeDomain(req.Domain)
	}
	engine := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("engine")))
	if engine == "" {
		engine = strings.ToLower(strings.TrimSpace(req.Engine))
	}
	name := normalizeDatabaseIdentifier(r.URL.Query().Get("name"))
	if name == "" {
		name = normalizeDatabaseIdentifier(req.Name)
	}
	if domain == "" || engine == "" || name == "" {
		writeError(w, http.StatusBadRequest, "domain, engine, and name are required")
		return
	}

	dbItem, err := s.loadStudioDatabaseMeta(domain, engine, name, sess)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "database not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	switch dbItem.Engine {
	case "postgres", "mariadb":
		sqlDB, closeFn, err := s.openSQLDatabase(dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer closeFn()

		if err := mutateSQLRow(r.Context(), sqlDB, dbItem, req, mode); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	case "mongodb":
		client, err := s.openMongoClient(r.Context(), dbItem)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer func() { _ = client.Disconnect(r.Context()) }()

		if err := mutateMongoRow(r.Context(), client, dbItem, req, mode); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	default:
		writeError(w, http.StatusBadRequest, "database engine is not supported")
		return
	}

	rowsResp, err := s.refreshStudioRows(r.Context(), dbItem, req.Object, 50, 0)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"rows":   rowsResp,
	})
}

func (s *server) refreshStudioRows(ctx context.Context, item databaseItem, objectName string, limit, offset int) (studioRowsResponse, error) {
	switch item.Engine {
	case "postgres", "mariadb":
		sqlDB, closeFn, err := s.openSQLDatabase(item)
		if err != nil {
			return studioRowsResponse{}, err
		}
		defer closeFn()
		return readSQLRows(ctx, sqlDB, item, objectName, limit, offset)
	case "mongodb":
		client, err := s.openMongoClient(ctx, item)
		if err != nil {
			return studioRowsResponse{}, err
		}
		defer func() { _ = client.Disconnect(ctx) }()
		return readMongoRows(ctx, client, item, objectName, limit, offset)
	default:
		return studioRowsResponse{}, errors.New("database engine is not supported")
	}
}

func readSQLRows(ctx context.Context, dbConn *sql.DB, item databaseItem, objectName string, limit, offset int) (studioRowsResponse, error) {
	if !isValidStudioIdentifier(objectName) {
		return studioRowsResponse{}, errors.New("table name is invalid")
	}

	columns, primaryKey, err := describeSQLObject(ctx, dbConn, item.Engine, objectName)
	if err != nil {
		return studioRowsResponse{}, err
	}

	orderBy := ""
	if len(primaryKey) > 0 {
		orderBy = " ORDER BY " + quoteSQLIdentifier(primaryKey[0], item.Engine)
	}
	query := fmt.Sprintf("SELECT * FROM %s%s LIMIT %d OFFSET %d", quoteSQLIdentifier(objectName, item.Engine), orderBy, limit, offset)

	rows, err := dbConn.QueryContext(ctx, query)
	if err != nil {
		return studioRowsResponse{}, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return studioRowsResponse{}, err
	}

	results := make([]map[string]any, 0)
	for rows.Next() {
		values := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range values {
			ptrs[i] = &values[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return studioRowsResponse{}, err
		}
		row := make(map[string]any, len(cols))
		for i, col := range cols {
			row[col] = normalizeDBValue(values[i])
		}
		results = append(results, row)
	}

	return studioRowsResponse{
		Database:   studioDatabaseItem{Domain: item.Domain, Engine: item.Engine, Name: item.Name, Username: item.Username, Host: item.Host, Port: item.Port, Status: item.Status},
		ObjectName: objectName,
		ObjectType: "table",
		PrimaryKey: primaryKey,
		Columns:    columns,
		Rows:       results,
	}, nil
}

func readMongoRows(ctx context.Context, client *mongo.Client, item databaseItem, collectionName string, limit, offset int) (studioRowsResponse, error) {
	if !isValidStudioIdentifier(collectionName) {
		return studioRowsResponse{}, errors.New("collection name is invalid")
	}

	dbName := mongoDatabaseName(item.ConnectionURI, item.Name)
	collection := client.Database(dbName).Collection(collectionName)
	opts := options.Find().SetLimit(int64(limit)).SetSkip(int64(offset)).SetSort(bson.D{{Key: "_id", Value: 1}})
	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return studioRowsResponse{}, err
	}
	defer cursor.Close(ctx)

	results := make([]map[string]any, 0)
	for cursor.Next(ctx) {
		var doc bson.M
		if err := cursor.Decode(&doc); err != nil {
			return studioRowsResponse{}, err
		}
		results = append(results, normalizeBSONMap(doc))
	}

	columns := make([]string, 0)
	if len(results) > 0 {
		for key := range results[0] {
			columns = append(columns, key)
		}
	}

	return studioRowsResponse{
		Database:   studioDatabaseItem{Domain: item.Domain, Engine: item.Engine, Name: item.Name, Username: item.Username, Host: item.Host, Port: item.Port, Status: item.Status},
		ObjectName: collectionName,
		ObjectType: "collection",
		PrimaryKey: []string{"_id"},
		Columns:    columns,
		Rows:       results,
	}, nil
}

func mutateSQLRow(ctx context.Context, dbConn *sql.DB, item databaseItem, req studioWriteRequest, mode string) error {
	if !isValidStudioIdentifier(req.Object) {
		return errors.New("table name is invalid")
	}
	if len(req.Data) == 0 && mode == "insert" {
		return errors.New("data is required")
	}

	switch mode {
	case "insert":
		columns := make([]string, 0, len(req.Data))
		values := make([]any, 0, len(req.Data))
		placeholders := make([]string, 0, len(req.Data))
		for key, value := range req.Data {
			if !isValidStudioIdentifier(key) {
				return fmt.Errorf("invalid column name: %s", key)
			}
			columns = append(columns, key)
			values = append(values, value)
			placeholders = append(placeholders, sqlPlaceholder(item.Engine, len(placeholders)+1))
		}
		query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", quoteSQLIdentifier(req.Object, item.Engine), quoteJoinedIdentifiers(columns, item.Engine), strings.Join(placeholders, ", "))
		_, err := dbConn.ExecContext(ctx, query, values...)
		return err
	case "update":
		if req.KeyColumn == "" {
			return errors.New("key_column is required")
		}
		if len(req.Data) == 0 {
			return errors.New("data is required")
		}
		if !isValidStudioIdentifier(req.KeyColumn) {
			return errors.New("key_column is invalid")
		}
		sets := make([]string, 0, len(req.Data))
		values := make([]any, 0, len(req.Data)+1)
		idx := 1
		for key, value := range req.Data {
			if !isValidStudioIdentifier(key) {
				return fmt.Errorf("invalid column name: %s", key)
			}
			sets = append(sets, fmt.Sprintf("%s = %s", quoteSQLIdentifier(key, item.Engine), sqlPlaceholder(item.Engine, idx)))
			values = append(values, value)
			idx++
		}
		values = append(values, req.KeyValue)
		query := fmt.Sprintf("UPDATE %s SET %s WHERE %s = %s", quoteSQLIdentifier(req.Object, item.Engine), strings.Join(sets, ", "), quoteSQLIdentifier(req.KeyColumn, item.Engine), sqlPlaceholder(item.Engine, idx))
		_, err := dbConn.ExecContext(ctx, query, values...)
		return err
	case "delete":
		if req.KeyColumn == "" {
			return errors.New("key_column is required")
		}
		if !isValidStudioIdentifier(req.KeyColumn) {
			return errors.New("key_column is invalid")
		}
		query := fmt.Sprintf("DELETE FROM %s WHERE %s = %s", quoteSQLIdentifier(req.Object, item.Engine), quoteSQLIdentifier(req.KeyColumn, item.Engine), sqlPlaceholder(item.Engine, 1))
		_, err := dbConn.ExecContext(ctx, query, req.KeyValue)
		return err
	default:
		return errors.New("mode is not supported")
	}
}

func mutateMongoRow(ctx context.Context, client *mongo.Client, item databaseItem, req studioWriteRequest, mode string) error {
	if !isValidStudioIdentifier(req.Object) {
		return errors.New("collection name is invalid")
	}
	collection := client.Database(mongoDatabaseName(item.ConnectionURI, item.Name)).Collection(req.Object)

	switch mode {
	case "insert":
		if len(req.Data) == 0 {
			return errors.New("data is required")
		}
		_, err := collection.InsertOne(ctx, normalizeBSONMap(req.Data))
		return err
	case "update":
		if req.KeyColumn == "" {
			req.KeyColumn = "_id"
		}
		filterValue := mongoNormalizeValue(req.KeyColumn, req.KeyValue)
		if req.KeyColumn == "_id" && filterValue == nil {
			return errors.New("key_value is invalid")
		}
		if len(req.Data) == 0 {
			return errors.New("data is required")
		}
		_, err := collection.UpdateOne(ctx, bson.M{req.KeyColumn: filterValue}, bson.M{"$set": normalizeBSONMap(req.Data)})
		return err
	case "delete":
		if req.KeyColumn == "" {
			req.KeyColumn = "_id"
		}
		filterValue := mongoNormalizeValue(req.KeyColumn, req.KeyValue)
		if req.KeyColumn == "_id" && filterValue == nil {
			return errors.New("key_value is invalid")
		}
		_, err := collection.DeleteOne(ctx, bson.M{req.KeyColumn: filterValue})
		return err
	default:
		return errors.New("mode is not supported")
	}
}

func describeSQLObject(ctx context.Context, dbConn *sql.DB, engine, objectName string) ([]string, []string, error) {
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		colsRows, err := dbConn.QueryContext(ctx, `
			SELECT column_name
			FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = $1
			ORDER BY ordinal_position`,
			objectName,
		)
		if err != nil {
			return nil, nil, err
		}
		defer colsRows.Close()

		columns := make([]string, 0)
		for colsRows.Next() {
			var name string
			if err := colsRows.Scan(&name); err != nil {
				return nil, nil, err
			}
			columns = append(columns, name)
		}

		pkRows, err := dbConn.QueryContext(ctx, `
			SELECT kcu.column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
			  ON tc.constraint_name = kcu.constraint_name
			 AND tc.table_schema = kcu.table_schema
			WHERE tc.constraint_type = 'PRIMARY KEY'
			  AND tc.table_schema = 'public'
			  AND tc.table_name = $1
			ORDER BY kcu.ordinal_position`,
			objectName,
		)
		if err != nil {
			return nil, nil, err
		}
		defer pkRows.Close()
		pks := make([]string, 0)
		for pkRows.Next() {
			var name string
			if err := pkRows.Scan(&name); err != nil {
				return nil, nil, err
			}
			pks = append(pks, name)
		}

		return columns, pks, nil
	case "mariadb":
		colsRows, err := dbConn.QueryContext(ctx, `
			SELECT column_name
			FROM information_schema.columns
			WHERE table_schema = DATABASE() AND table_name = ?
			ORDER BY ordinal_position`,
			objectName,
		)
		if err != nil {
			return nil, nil, err
		}
		defer colsRows.Close()

		columns := make([]string, 0)
		for colsRows.Next() {
			var name string
			if err := colsRows.Scan(&name); err != nil {
				return nil, nil, err
			}
			columns = append(columns, name)
		}

		pkRows, err := dbConn.QueryContext(ctx, `
			SELECT column_name
			FROM information_schema.key_column_usage
			WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = 'PRIMARY'
			ORDER BY ordinal_position`,
			objectName,
		)
		if err != nil {
			return nil, nil, err
		}
		defer pkRows.Close()
		pks := make([]string, 0)
		for pkRows.Next() {
			var name string
			if err := pkRows.Scan(&name); err != nil {
				return nil, nil, err
			}
			pks = append(pks, name)
		}

		return columns, pks, nil
	default:
		return nil, nil, errors.New("database engine is not supported")
	}
}

func quoteSQLIdentifier(value, engine string) string {
	if strings.EqualFold(engine, "mariadb") {
		return "`" + strings.ReplaceAll(value, "`", "``") + "`"
	}
	return pqIdent(value)
}

func quoteJoinedIdentifiers(values []string, engine string) string {
	quoted := make([]string, 0, len(values))
	for _, value := range values {
		quoted = append(quoted, quoteSQLIdentifier(value, engine))
	}
	return strings.Join(quoted, ", ")
}

func sqlPlaceholder(engine string, index int) string {
	if strings.EqualFold(engine, "mariadb") {
		return "?"
	}
	return "$" + strconv.Itoa(index)
}

func normalizeDBValue(value any) any {
	switch v := value.(type) {
	case nil:
		return nil
	case []byte:
		return string(v)
	case time.Time:
		return v.Format(time.RFC3339)
	default:
		return v
	}
}

func normalizeBSONMap(in map[string]any) map[string]any {
	out := make(map[string]any, len(in))
	for key, value := range in {
		out[key] = mongoNormalizeValue(key, value)
	}
	return out
}

func mongoNormalizeValue(key string, value any) any {
	switch v := value.(type) {
	case primitive.ObjectID:
		return v.Hex()
	case primitive.DateTime:
		return time.UnixMilli(int64(v)).UTC().Format(time.RFC3339)
	case map[string]any:
		return normalizeBSONMap(v)
	case bson.M:
		return normalizeBSONMap(v)
	case bson.D:
		next := make(map[string]any, len(v))
		for _, elem := range v {
			next[elem.Key] = mongoNormalizeValue(elem.Key, elem.Value)
		}
		return next
	case bson.A:
		next := make([]any, 0, len(v))
		for _, item := range v {
			next = append(next, mongoNormalizeValue(key, item))
		}
		return next
	case []any:
		next := make([]any, 0, len(v))
		for _, item := range v {
			next = append(next, mongoNormalizeValue(key, item))
		}
		return next
	case string:
		if key == "_id" {
			if oid, err := primitive.ObjectIDFromHex(v); err == nil {
				return oid
			}
		}
		return v
	case time.Time:
		return v.UTC().Format(time.RFC3339)
	case []byte:
		return string(v)
	default:
		return v
	}
}

func mongoDatabaseName(connectionURI, fallback string) string {
	parsed, err := url.Parse(connectionURI)
	if err != nil {
		return fallback
	}
	if parsed.Path == "" || parsed.Path == "/" {
		return fallback
	}
	return strings.TrimPrefix(parsed.Path, "/")
}

func isValidStudioIdentifier(value string) bool {
	if value == "" {
		return false
	}
	matched, _ := regexp.MatchString(`^[a-zA-Z_][a-zA-Z0-9_]*$`, value)
	return matched
}

func (s *server) withAuth(handler func(http.ResponseWriter, *http.Request, sessionRow)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess, ok := s.currentSession(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		handler(w, r, sess)
	}
}

func (s *server) withMailAuth(handler func(http.ResponseWriter, *http.Request, mailSessionRow)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess, ok := s.currentMailSession(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		handler(w, r, sess)
	}
}

func (s *server) withAdminAuth(handler func(http.ResponseWriter, *http.Request, sessionRow)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess, ok := s.currentSession(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		user, err := s.loadUser(sess.Email)
		if err != nil || !user.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}

		handler(w, r, sess)
	}
}

func (s *server) currentMailSession(r *http.Request) (mailSessionRow, bool) {
	var cookies []string
	for _, cookie := range r.Cookies() {
		if cookie.Name == mailAuthCookieName && strings.TrimSpace(cookie.Value) != "" {
			cookies = append(cookies, cookie.Value)
		}
	}
	if len(cookies) == 0 {
		return mailSessionRow{}, false
	}

	for _, token := range cookies {
		tokenHash := s.hashToken(token)
		var sess mailSessionRow
		var expiresAt time.Time
		err := s.mailDB.QueryRow(
			`SELECT token_hash, email, expires_at, last_seen_at FROM mail_sessions WHERE token_hash = $1`,
			tokenHash,
		).Scan(&sess.TokenHash, &sess.Email, &expiresAt, &sess.LastSeenAt)
		if err != nil {
			continue
		}

		if time.Now().After(expiresAt) {
			_, _ = s.mailDB.Exec(`DELETE FROM mail_sessions WHERE token_hash = $1`, tokenHash)
			continue
		}

		sess.ExpiresAt = expiresAt
		_, _ = s.mailDB.Exec(`UPDATE mail_sessions SET last_seen_at = NOW() WHERE token_hash = $1`, tokenHash)
		return sess, true
	}
	return mailSessionRow{}, false
}

func isAllowedPublicOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	if strings.EqualFold(origin, "https://diworkin.com") || strings.EqualFold(origin, "https://www.diworkin.com") {
		return true
	}
	return strings.HasSuffix(strings.ToLower(origin), ".diworkin.com")
}

func (s *server) withPublicCORS(handler func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if isAllowedPublicOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Add("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		handler(w, r)
	}
}

func (s *server) currentSession(r *http.Request) (sessionRow, bool) {
	var cookies []string
	for _, cookie := range r.Cookies() {
		if cookie.Name == authCookieName && strings.TrimSpace(cookie.Value) != "" {
			cookies = append(cookies, cookie.Value)
		}
	}
	if len(cookies) == 0 {
		return sessionRow{}, false
	}

	for _, token := range cookies {
		tokenHash := s.hashToken(token)
		var sess sessionRow
		var expiresAt time.Time
		err := s.db.QueryRow(
			`SELECT token_hash, email, expires_at, last_seen_at FROM panel_sessions WHERE token_hash = $1`,
			tokenHash,
		).Scan(&sess.TokenHash, &sess.Email, &expiresAt, &sess.LastSeenAt)
		if err != nil {
			continue
		}

		if time.Now().After(expiresAt) {
			_, _ = s.db.Exec(`DELETE FROM panel_sessions WHERE token_hash = $1`, tokenHash)
			continue
		}

		sess.ExpiresAt = expiresAt
		_, _ = s.db.Exec(`UPDATE panel_sessions SET last_seen_at = NOW() WHERE token_hash = $1`, tokenHash)
		return sess, true
	}
	return sessionRow{}, false
}

func (s *server) lookupUser(email string) (User, string, error) {
	var user User
	var passwordHash string
	var company string
	var emailVerified bool
	var emailVerifiedAt sql.NullTime
	var approved bool
	var isAdmin bool
	var approvedAt sql.NullTime
	var createdAt time.Time

	err := s.db.QueryRow(
		`SELECT name, company, email, password_hash, email_verified, email_verified_at, approved, is_admin, created_at, approved_at
		 FROM panel_users WHERE lower(email) = lower($1)`,
		normalizeEmail(email),
	).Scan(&user.Name, &company, &user.Email, &passwordHash, &emailVerified, &emailVerifiedAt, &approved, &isAdmin, &createdAt, &approvedAt)
	if err != nil {
		return User{}, "", err
	}

	user.Company = company
	user.Initials = getInitials(user.Name, getInitials(user.Email, "DW"))
	user.EmailVerified = emailVerified
	user.Approved = approved
	user.IsAdmin = isAdmin
	user.CreatedAt = createdAt.Format(time.RFC3339)
	if emailVerifiedAt.Valid {
		user.EmailVerifiedAt = emailVerifiedAt.Time.Format(time.RFC3339)
	}
	user.Status = "pending_verification"
	if emailVerified {
		user.Status = "pending_approval"
	}
	if approved {
		user.Status = "approved"
	}
	if approvedAt.Valid {
		user.ApprovedAt = approvedAt.Time.Format(time.RFC3339)
	}
	return user, passwordHash, nil
}

func (s *server) loadUser(email string) (User, error) {
	user, _, err := s.lookupUser(email)
	return user, err
}

func (s *server) createSession(email string) (string, time.Time, error) {
	token, err := randomToken(32)
	if err != nil {
		return "", time.Time{}, err
	}

	expiresAt := time.Now().Add(sessionTTL)
	tokenHash := s.hashToken(token)

	_, err = s.db.Exec(
		`INSERT INTO panel_sessions (token_hash, email, expires_at) VALUES ($1, $2, $3)
		 ON CONFLICT (token_hash) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at, last_seen_at = NOW()`,
		tokenHash,
		normalizeEmail(email),
		expiresAt,
	)
	if err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

func (s *server) setSessionCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	cookie := &http.Cookie{
		Name:     authCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
	if domain := strings.TrimSpace(s.cookieDomain); domain != "" {
		cookie.Domain = domain
	}
	http.SetCookie(w, cookie)
}

func (s *server) clearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     authCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
	if domain := strings.TrimSpace(s.cookieDomain); domain != "" {
		cookie.Domain = domain
	}
	http.SetCookie(w, cookie)
}

func (s *server) wantsBrowserRedirect(r *http.Request) bool {
	contentType := strings.ToLower(strings.TrimSpace(strings.Split(r.Header.Get("Content-Type"), ";")[0]))
	if contentType == "application/x-www-form-urlencoded" || contentType == "multipart/form-data" {
		return true
	}

	accept := strings.ToLower(r.Header.Get("Accept"))
	return strings.Contains(accept, "text/html") && !strings.Contains(accept, "application/json")
}

func (s *server) respondAuthFailure(w http.ResponseWriter, r *http.Request, status int, message string) {
	if s.wantsBrowserRedirect(r) {
		escaped := url.QueryEscape(message)
		code := http.StatusSeeOther
		if status == http.StatusUnauthorized || status == http.StatusForbidden || status == http.StatusBadRequest {
			http.Redirect(w, r, "/login?error="+escaped, code)
			return
		}
		http.Redirect(w, r, "/login?error="+escaped, code)
		return
	}

	writeError(w, status, message)
}

func (s *server) hashToken(token string) string {
	sum := sha256.Sum256([]byte(s.sessionSecret + ":" + token))
	return hex.EncodeToString(sum[:])
}

func decodeAuthRequest(w http.ResponseWriter, r *http.Request) (authRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req authRequest

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return authRequest{}, errors.New("invalid request body")
	}

	contentType := strings.ToLower(strings.TrimSpace(strings.Split(r.Header.Get("Content-Type"), ";")[0]))
	parsed := false

	if contentType == "application/json" || len(body) > 0 && bytes.HasPrefix(bytes.TrimSpace(body), []byte("{")) {
		if err := json.Unmarshal(body, &req); err == nil {
			parsed = true
		}
	}

	if !parsed {
		if formValues, err := url.ParseQuery(string(body)); err == nil {
			req.Name = formValues.Get("name")
			req.Company = formValues.Get("company")
			req.Email = formValues.Get("email")
			req.Password = formValues.Get("password")
			req.ReferralCode = formValues.Get("referral_code")
			req.CouponCode = formValues.Get("coupon_code")
			parsed = req.Email != "" || req.Password != "" || req.Name != "" || req.Company != ""
		}
	}

	if !parsed {
		return authRequest{}, errors.New("invalid JSON body")
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Company = strings.TrimSpace(req.Company)
	req.Email = normalizeEmail(req.Email)
	req.ReferralCode = strings.TrimSpace(req.ReferralCode)
	req.CouponCode = strings.TrimSpace(req.CouponCode)
	return req, nil
}

func decodeApproveRequest(w http.ResponseWriter, r *http.Request) (approveRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req approveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return approveRequest{}, errors.New("invalid JSON body")
	}

	req.Email = normalizeEmail(req.Email)
	if req.Email == "" {
		return approveRequest{}, errors.New("email is required")
	}

	return req, nil
}

func decodeDomainRequest(w http.ResponseWriter, r *http.Request) (domainRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req domainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return domainRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.ProjectName = strings.TrimSpace(req.ProjectName)
	return req, nil
}

func decodeDomainDeleteRequest(w http.ResponseWriter, r *http.Request) (domainRequest, error) {
	if r.Method == http.MethodDelete {
		var req domainRequest
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
			return domainRequest{}, errors.New("invalid JSON body")
		}
		req.Domain = normalizeDomain(req.Domain)
		return req, nil
	}

	return decodeDomainRequest(w, r)
}

func decodeMailAccountRequest(w http.ResponseWriter, r *http.Request) (mailAccountRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req mailAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return mailAccountRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.LocalPart = normalizeMailboxLocalPart(req.LocalPart)
	req.Password = strings.TrimSpace(req.Password)
	req.Email = normalizeEmail(req.Email)
	return req, nil
}

func decodeFileManagerRequest(w http.ResponseWriter, r *http.Request) (fileManagerRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req fileManagerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fileManagerRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Path = cleanFileManagerPath(req.Path)
	req.Kind = strings.ToLower(strings.TrimSpace(req.Kind))
	req.Name = strings.TrimSpace(req.Name)
	req.NewName = strings.TrimSpace(req.NewName)
	req.Content = req.Content
	return req, nil
}

func normalizeDomain(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	value = strings.TrimPrefix(value, "http://")
	value = strings.TrimPrefix(value, "https://")
	value = strings.TrimPrefix(value, "www.")
	value = strings.Trim(value, "/")
	value = strings.TrimSuffix(value, ".")
	return value
}

func isValidDomainName(domain string) bool {
	if domain == "" || len(domain) > 253 {
		return false
	}

	labelRE := regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`)
	labels := strings.Split(domain, ".")
	if len(labels) < 2 {
		return false
	}

	for _, label := range labels {
		if !labelRE.MatchString(label) {
			return false
		}
	}

	return true
}

func isValidMailboxLocalPart(localPart string) bool {
	if localPart == "" || len(localPart) > 64 {
		return false
	}

	matched, _ := regexp.MatchString(`^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$`, localPart)
	return matched
}

func normalizeMailboxLocalPart(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func makeMailboxAddress(localPart, domain string) string {
	return normalizeMailboxLocalPart(localPart) + "@" + normalizeDomain(domain)
}

func decodeDNSRecordRequest(w http.ResponseWriter, r *http.Request) (dnsRecordRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req dnsRecordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return dnsRecordRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Name = strings.TrimSpace(req.Name)
	req.Type = strings.ToUpper(strings.TrimSpace(req.Type))
	req.Content = strings.TrimSpace(req.Content)
	req.OriginalName = strings.TrimSpace(req.OriginalName)
	req.OriginalType = strings.ToUpper(strings.TrimSpace(req.OriginalType))
	return req, nil
}

func decodeDatabaseRequest(w http.ResponseWriter, r *http.Request) (databaseRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req databaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return databaseRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Engine = strings.ToLower(strings.TrimSpace(req.Engine))
	req.Name = normalizeDatabaseIdentifier(req.Name)
	req.Username = normalizeDatabaseIdentifier(req.Username)
	req.Password = strings.TrimSpace(req.Password)
	return req, nil
}

func normalizeDNSRecordName(raw, domain string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	domain = normalizeDomain(domain)
	if value == "" || value == "@" {
		return domain
	}
	value = strings.TrimSuffix(value, ".")
	if value == domain || strings.HasSuffix(value, "."+domain) {
		return strings.TrimSuffix(value, "."+domain)
	}
	return value
}

func isValidDNSRecordType(recordType string) bool {
	switch strings.ToUpper(strings.TrimSpace(recordType)) {
	case "A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA":
		return true
	default:
		return false
	}
}

func isValidDatabaseIdentifier(value string) bool {
	if value == "" || len(value) > 63 {
		return false
	}

	matched, _ := regexp.MatchString(`^[a-z][a-z0-9_]*$`, value)
	return matched
}

func normalizeDatabaseIdentifier(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	value = strings.ReplaceAll(value, "-", "_")
	value = strings.ReplaceAll(value, " ", "_")
	return value
}

func normalizePackageName(raw string) string {
	return strings.TrimSpace(raw)
}

func decodePackageRequest(w http.ResponseWriter, r *http.Request) (packageRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req packageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return packageRequest{}, errors.New("invalid JSON body")
	}

	req.Name = normalizePackageName(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.BillingCycle = strings.ToLower(strings.TrimSpace(req.BillingCycle))
	if req.BillingCycle == "" {
		req.BillingCycle = "monthly"
	}
	return req, nil
}

func normalizeSubdomainLabel(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	value = strings.TrimPrefix(value, "http://")
	value = strings.TrimPrefix(value, "https://")
	value = strings.Trim(value, ".")
	return value
}

func isValidSubdomainLabel(label string) bool {
	label = normalizeSubdomainLabel(label)
	if label == "" || len(label) > 63 {
		return false
	}
	matched, _ := regexp.MatchString(`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`, label)
	return matched
}

func makeSubdomainHost(subdomain, domain string) string {
	subdomain = normalizeSubdomainLabel(subdomain)
	domain = normalizeDomain(domain)
	if subdomain == "" {
		return domain
	}
	return subdomain + "." + domain
}

func getSubdomainInstallSteps(appType string) []string {
	switch strings.ToLower(strings.TrimSpace(appType)) {
	case "wordpress":
		return []string{
			"Validate domain and owner",
			"Prepare MariaDB database",
			"Download WordPress starter",
			"Write wp-config settings",
			"Create DNS and Nginx site",
			"Finalize installer",
		}
	case "codeigniter":
		return []string{
			"Validate domain and owner",
			"Prepare MariaDB database",
			"Download CodeIgniter starter",
			"Write configuration files",
			"Create DNS and Nginx site",
			"Finalize installer",
		}
	case "laravel":
		return []string{
			"Validate domain and owner",
			"Prepare MariaDB database",
			"Download Laravel starter",
			"Generate application key",
			"Create DNS and Nginx site",
			"Finalize installer",
		}
	default:
		return []string{
			"Validate domain and owner",
			"Create folder public subdomain",
			"Create DNS and Nginx site",
			"Finalize installer",
		}
	}
}

func getSiteInstallSteps(targetKind, appType string) []string {
	if strings.ToLower(strings.TrimSpace(targetKind)) != "domain" {
		return getSubdomainInstallSteps(appType)
	}

	switch strings.ToLower(strings.TrimSpace(appType)) {
	case "wordpress":
		return []string{
			"Validate domain and owner",
			"Prepare MariaDB database",
			"Prepare domain public folder",
			"Download WordPress starter",
			"Issue SSL and redirect to HTTPS",
			"Finalize installer",
		}
	case "codeigniter":
		return []string{
			"Validate domain and owner",
			"Prepare MariaDB database",
			"Prepare domain public folder",
			"Download CodeIgniter starter",
			"Issue SSL and redirect to HTTPS",
			"Finalize installer",
		}
	case "laravel":
		return []string{
			"Validate domain and owner",
			"Prepare MariaDB database",
			"Prepare domain public folder",
			"Download Laravel starter",
			"Issue SSL and redirect to HTTPS",
			"Finalize installer",
		}
	default:
		return []string{
			"Validate domain and owner",
			"Prepare domain public folder",
			"Issue SSL and redirect to HTTPS",
			"Finalize installer",
		}
	}
}

func decodeSubdomainRequest(w http.ResponseWriter, r *http.Request) (subdomainRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req subdomainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return subdomainRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Subdomain = normalizeSubdomainLabel(req.Subdomain)
	req.ProjectName = strings.TrimSpace(req.ProjectName)
	req.AppType = strings.ToLower(strings.TrimSpace(req.AppType))
	if req.AppType == "" {
		req.AppType = "plain"
	}
	req.TargetKind = strings.ToLower(strings.TrimSpace(req.TargetKind))
	return req, nil
}

func decodeWordPressPasswordRequest(w http.ResponseWriter, r *http.Request) (wordpressPasswordRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req wordpressPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return wordpressPasswordRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Subdomain = normalizeSubdomainLabel(req.Subdomain)
	req.AppType = strings.ToLower(strings.TrimSpace(req.AppType))
	req.TargetKind = strings.ToLower(strings.TrimSpace(req.TargetKind))
	req.Password = strings.TrimSpace(req.Password)
	return req, nil
}

func decodeSSLIssueRequest(w http.ResponseWriter, r *http.Request) (sslIssueRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req sslIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return sslIssueRequest{}, errors.New("invalid JSON body")
	}

	req.Kind = strings.ToLower(strings.TrimSpace(req.Kind))
	req.Domain = normalizeDomain(req.Domain)
	req.Subdomain = normalizeSubdomainLabel(req.Subdomain)
	return req, nil
}

func cleanFileManagerPath(raw string) string {
	value := strings.TrimSpace(raw)
	value = strings.TrimPrefix(value, "/")
	value = strings.TrimPrefix(value, "./")
	value = filepath.ToSlash(value)
	value = strings.TrimSuffix(value, "/")
	return value
}

func (s *server) hostRecordReady(host string) (bool, error) {
	host = normalizeHost(host)
	if host == "" {
		return false, errors.New("host kosong")
	}

	ips, err := lookupHostIPs(host)
	if err != nil {
		return false, err
	}

	ip := s.serverIP()
	if ip == "" {
		return len(ips) > 0, nil
	}

	return containsString(ips, ip), nil
}

func (s *server) authoritativeSubdomainDNSReady(domain, fullDomain string) (bool, error) {
	domain = normalizeDomain(domain)
	fullDomain = normalizeDomain(fullDomain)
	if domain == "" || fullDomain == "" {
		return false, errors.New("domain is empty")
	}

	records, err := s.readDNSZone(domain)
	if err != nil {
		return false, err
	}
	subdomain := subdomainLabelFromFullDomain(fullDomain, domain)
	if subdomain == "" {
		subdomain = normalizeSubdomainLabel(fullDomain)
	}

	for _, record := range records {
		recordName := normalizeHost(record.Name)
		if recordName == "" {
			continue
		}
		if (recordName == subdomain || recordName == fullDomain || recordName == "www."+subdomain || recordName == "www."+fullDomain) && strings.EqualFold(record.Type, "A") {
			if strings.TrimSpace(record.Content) != "" {
				return true, nil
			}
		}
	}

	return false, nil
}

func isValidFileName(name string) bool {
	name = strings.TrimSpace(name)
	if name == "" || name == "." || name == ".." {
		return false
	}
	if strings.ContainsAny(name, "/\\") {
		return false
	}
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9._-]+(?: [a-zA-Z0-9._-]+)*$`, name)
	return matched
}

func resolveRelativePath(basePath, relPath string) (string, error) {
	basePath = filepath.Clean(basePath)
	relPath = cleanFileManagerPath(relPath)
	if relPath == "" {
		return basePath, nil
	}

	absPath := filepath.Clean(filepath.Join(basePath, filepath.FromSlash(relPath)))
	if !pathWithinBase(basePath, absPath) {
		return "", errors.New("path is outside the domain folder")
	}
	return absPath, nil
}

func resolveChildPath(basePath, parentPath string, name string) (string, error) {
	parentPath = filepath.Clean(parentPath)
	if !pathWithinBase(filepath.Clean(basePath), parentPath) {
		return "", errors.New("path is outside the domain folder")
	}
	targetPath := filepath.Clean(filepath.Join(parentPath, name))
	basePath = filepath.Clean(basePath)
	if !pathWithinBase(basePath, targetPath) {
		return "", errors.New("path is outside the domain folder")
	}
	return targetPath, nil
}

func pathWithinBase(basePath, targetPath string) bool {
	basePath = filepath.Clean(basePath)
	targetPath = filepath.Clean(targetPath)
	if basePath == targetPath {
		return true
	}
	prefix := basePath + string(os.PathSeparator)
	return strings.HasPrefix(targetPath, prefix)
}

func (s *server) resolveDomainFilePath(domain, relPath string) (string, string, string, error) {
	basePath, err := s.fileManagerTargetPublicPath(domain)
	if err != nil {
		return "", "", "", err
	}
	return s.resolveTargetPathFromBase(basePath, relPath)
}

func (s *server) resolveTargetPathFromBase(basePath, relPath string) (string, string, string, error) {
	basePath = filepath.Clean(basePath)
	absPath, err := resolveRelativePath(basePath, relPath)
	if err != nil {
		return "", "", "", err
	}

	relPath = cleanFileManagerPath(relPath)
	return basePath, absPath, relPath, nil
}

func (s *server) fileManagerTargetPublicPath(domain string) (string, error) {
	domain = normalizeDomain(domain)
	if domain == "" {
		return "", errors.New("domain is required")
	}

	var publicPath string
	err := s.db.QueryRow(
		`SELECT public_path FROM panel_domains WHERE lower(domain) = lower($1)`,
		domain,
	).Scan(&publicPath)
	if err == nil && strings.TrimSpace(publicPath) != "" {
		return strings.TrimSpace(publicPath), nil
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	err = s.db.QueryRow(
		`SELECT public_path FROM panel_subdomains
		 WHERE lower(full_domain) = lower($1) OR lower(subdomain) = lower($1)
		 ORDER BY created_at DESC
		 LIMIT 1`,
		domain,
	).Scan(&publicPath)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(publicPath) == "" {
		return "", sql.ErrNoRows
	}
	return strings.TrimSpace(publicPath), nil
}

func (s *server) resolveSiteTargetMeta(target string) (string, string, error) {
	target = normalizeDomain(target)
	if target == "" {
		return "", "", errors.New("target is required")
	}

	var basePath string
	if err := s.db.QueryRow(
		`SELECT public_path FROM panel_domains WHERE lower(domain) = lower($1)`,
		target,
	).Scan(&basePath); err == nil {
		if strings.TrimSpace(basePath) == "" {
			return "", "", sql.ErrNoRows
		}
		return "domain", strings.TrimSpace(basePath), nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return "", "", err
	}

	if err := s.db.QueryRow(
		`SELECT public_path FROM panel_subdomains
		 WHERE lower(full_domain) = lower($1) OR lower(subdomain) = lower($1)
		 ORDER BY created_at DESC
		 LIMIT 1`,
		target,
	).Scan(&basePath); err == nil {
		if strings.TrimSpace(basePath) == "" {
			return "", "", sql.ErrNoRows
		}
		return "subdomain", strings.TrimSpace(basePath), nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return "", "", err
	}

	return "", "", sql.ErrNoRows
}

func ftpPasswordKey(value string) ([]byte, error) {
	return []byte(strings.TrimSpace(value)), nil
}

func (s *server) encryptFTPSecret(value string) (string, error) {
	return s.encryptMailAccessSecret(value)
}

func (s *server) decryptFTPSecret(value string) (string, error) {
	return s.decryptMailAccessSecret(value)
}

func tokenizeRestrictedCommand(input string) ([]string, error) {
	input = strings.TrimSpace(input)
	if input == "" {
		return nil, errors.New("command is required")
	}
	if strings.ContainsAny(input, "\n\r") {
		return nil, errors.New("command contains newline characters")
	}

	tokens := make([]string, 0)
	var current strings.Builder
	inSingle := false
	inDouble := false
	escaped := false

	flush := func() {
		if current.Len() > 0 {
			tokens = append(tokens, current.String())
			current.Reset()
		}
	}

	for _, r := range input {
		switch {
		case escaped:
			current.WriteRune(r)
			escaped = false
		case r == '\\' && !inSingle:
			escaped = true
		case r == '\'' && !inDouble:
			inSingle = !inSingle
		case r == '"' && !inSingle:
			inDouble = !inDouble
		case unicode.IsSpace(r) && !inSingle && !inDouble:
			flush()
		default:
			current.WriteRune(r)
		}
	}

	if escaped || inSingle || inDouble {
		return nil, errors.New("command contains unbalanced quotes")
	}
	flush()
	if len(tokens) == 0 {
		return nil, errors.New("command is required")
	}
	return tokens, nil
}

func isAllowedRestrictedCommand(name string) bool {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "pwd", "ls", "cat", "head", "tail", "grep", "find", "mkdir", "touch", "cp", "mv", "rm", "chmod", "chown", "du", "stat", "wc", "sort", "sed", "file", "php", "composer", "npm", "npx", "node", "python", "python3", "go", "git", "wp":
		return true
	default:
		return false
	}
}

func isRestrictedCommandArgSafe(arg string) bool {
	if strings.ContainsAny(arg, ";&|><`$") {
		return false
	}
	if strings.HasPrefix(arg, "/") {
		return false
	}
	if strings.Contains(arg, "../") || strings.Contains(arg, "/..") {
		return false
	}
	return true
}

func (s *server) runRestrictedShellCommand(basePath, rawCommand string) (string, int, error) {
	tokens, err := tokenizeRestrictedCommand(rawCommand)
	if err != nil {
		return "", 0, err
	}
	if !isAllowedRestrictedCommand(tokens[0]) {
		return "", 0, errors.New("command is not allowed")
	}
	for _, token := range tokens[1:] {
		if !strings.HasPrefix(token, "-") && !isRestrictedCommandArgSafe(token) {
			return "", 0, errors.New("paths outside the shell folder are not allowed")
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, tokens[0], tokens[1:]...)
	cmd.Dir = basePath
	cmd.Env = append(os.Environ(),
		"HOME="+basePath,
		"PWD="+basePath,
		"TERM=dumb",
		"LANG=C",
	)

	var output bytes.Buffer
	cmd.Stdout = &output
	cmd.Stderr = &output

	err = cmd.Run()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else if ctx.Err() == context.DeadlineExceeded {
			exitCode = 124
		} else {
			return strings.TrimSpace(output.String()), 1, err
		}
	}
	rendered := strings.TrimSpace(output.String())
	if rendered == "" {
		rendered = "(no output)"
	}
	if len(rendered) > 12000 {
		rendered = rendered[:12000] + "\n... output truncated ..."
	}
	return rendered, exitCode, nil
}

func (s *server) ftpAccounts(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listFTPAccounts(w, r, sess)
	case http.MethodPost:
		s.saveFTPAccount(w, r, sess, false)
	case http.MethodPut:
		s.saveFTPAccount(w, r, sess, true)
	case http.MethodDelete:
		s.deleteFTPAccount(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listFTPAccounts(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT id, owner_email, site_target, target_kind, base_path, username, (password_enc <> '') AS password_ready, active, created_at, updated_at
		FROM panel_ftp_accounts`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, user.Email)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load FTP accounts")
		return
	}
	defer rows.Close()

	items := make([]ftpAccountItem, 0)
	for rows.Next() {
		var item ftpAccountItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.OwnerEmail, &item.SiteTarget, &item.TargetKind, &item.BasePath, &item.Username, &item.PasswordReady, &item.Active, &createdAt, &updatedAt); err != nil {
			continue
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		items = append(items, item)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *server) saveFTPAccount(w http.ResponseWriter, r *http.Request, sess sessionRow, update bool) {
	var req ftpAccountRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req.SiteTarget = normalizeDomain(req.SiteTarget)
	req.Username = normalizeMailboxLocalPart(req.Username)
	req.Password = strings.TrimSpace(req.Password)
	if req.SiteTarget == "" || req.Username == "" {
		writeError(w, http.StatusBadRequest, "site_target dan username is required")
		return
	}
	if !isValidMailboxLocalPart(req.Username) {
		writeError(w, http.StatusBadRequest, "FTP username is invalid")
		return
	}
	if !user.IsAdmin {
		allowed, err := s.canManagePanelDomain(user, req.SiteTarget)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify target")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	targetKind, basePath, err := s.resolveSiteTargetMeta(req.SiteTarget)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "target not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Password == "" && !update {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}

	passwordEnc := ""
	if req.Password != "" {
		passwordEnc, err = s.encryptFTPSecret(req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to encrypt FTP password")
			return
		}
	}

	now := time.Now().UTC()
	active := true
	if req.Active != nil {
		active = *req.Active
	}

	if update {
		if req.ID == 0 {
			writeError(w, http.StatusBadRequest, "id is required for update")
			return
		}
		if passwordEnc != "" {
			_, err = s.db.Exec(
				`UPDATE panel_ftp_accounts
				 SET site_target = $1, target_kind = $2, base_path = $3, username = $4, password_enc = $5, active = $6, updated_at = $7
				 WHERE id = $8 AND lower(owner_email) = lower($9)`,
				req.SiteTarget,
				targetKind,
				basePath,
				req.Username,
				passwordEnc,
				active,
				now,
				req.ID,
				user.Email,
			)
		} else {
			_, err = s.db.Exec(
				`UPDATE panel_ftp_accounts
				 SET site_target = $1, target_kind = $2, base_path = $3, username = $4, active = $5, updated_at = $6
				 WHERE id = $7 AND lower(owner_email) = lower($8)`,
				req.SiteTarget,
				targetKind,
				basePath,
				req.Username,
				active,
				now,
				req.ID,
				user.Email,
			)
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update FTP account")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
		return
	}

	if passwordEnc == "" {
		writeError(w, http.StatusBadRequest, "FTP password is required")
		return
	}

	if _, err := s.db.Exec(
		`INSERT INTO panel_ftp_accounts (owner_email, site_target, target_kind, base_path, username, password_enc, active, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
		user.Email,
		req.SiteTarget,
		targetKind,
		basePath,
		req.Username,
		passwordEnc,
		active,
		now,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create FTP account")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"status": "ok"})
}

func (s *server) deleteFTPAccount(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	id := int64(0)
	if raw := strings.TrimSpace(r.URL.Query().Get("id")); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil {
			id = parsed
		}
	}
	if id == 0 {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	result, err := s.db.Exec(`DELETE FROM panel_ftp_accounts WHERE id = $1 AND lower(owner_email) = lower($2)`, id, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete FTP account")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "FTP account not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

func (s *server) shellSessions(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listShellSessions(w, r, sess)
	case http.MethodPost:
		s.saveShellSession(w, r, sess, false)
	case http.MethodPut:
		s.saveShellSession(w, r, sess, true)
	case http.MethodDelete:
		s.deleteShellSession(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listShellSessions(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT id, owner_email, site_target, target_kind, base_path, name, active, last_command, last_output, last_exit_code, created_at, updated_at
		FROM panel_shell_sessions`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, user.Email)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load shell sessions")
		return
	}
	defer rows.Close()

	items := make([]shellSessionItem, 0)
	for rows.Next() {
		var item shellSessionItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.OwnerEmail, &item.SiteTarget, &item.TargetKind, &item.BasePath, &item.Name, &item.Active, &item.LastCommand, &item.LastOutput, &item.LastExitCode, &createdAt, &updatedAt); err != nil {
			continue
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		items = append(items, item)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *server) saveShellSession(w http.ResponseWriter, r *http.Request, sess sessionRow, update bool) {
	var req shellSessionRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req.SiteTarget = normalizeDomain(req.SiteTarget)
	req.Name = strings.TrimSpace(req.Name)
	if req.SiteTarget == "" {
		writeError(w, http.StatusBadRequest, "site_target is required")
		return
	}
	if req.Name == "" {
		req.Name = req.SiteTarget
	}
	if !user.IsAdmin {
		allowed, err := s.canManagePanelDomain(user, req.SiteTarget)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify target")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	targetKind, basePath, err := s.resolveSiteTargetMeta(req.SiteTarget)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "target not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	active := true
	if req.Active != nil {
		active = *req.Active
	}

	now := time.Now().UTC()
	if update {
		if req.ID == 0 {
			writeError(w, http.StatusBadRequest, "id is required for update")
			return
		}
		result, err := s.db.Exec(
			`UPDATE panel_shell_sessions
			 SET site_target = $1, target_kind = $2, base_path = $3, name = $4, active = $5, updated_at = $6
			 WHERE id = $7 AND lower(owner_email) = lower($8)`,
			req.SiteTarget,
			targetKind,
			basePath,
			req.Name,
			active,
			now,
			req.ID,
			user.Email,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update shell session")
			return
		}
		if affected, _ := result.RowsAffected(); affected == 0 {
			writeError(w, http.StatusNotFound, "shell session not found")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
		return
	}

	if _, err := s.db.Exec(
		`INSERT INTO panel_shell_sessions (owner_email, site_target, target_kind, base_path, name, active, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
		user.Email,
		req.SiteTarget,
		targetKind,
		basePath,
		req.Name,
		active,
		now,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create shell session")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"status": "ok"})
}

func (s *server) deleteShellSession(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	id := int64(0)
	if raw := strings.TrimSpace(r.URL.Query().Get("id")); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil {
			id = parsed
		}
	}
	if id == 0 {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	result, err := s.db.Exec(`DELETE FROM panel_shell_sessions WHERE id = $1 AND lower(owner_email) = lower($2)`, id, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete shell session")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "shell session not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

func (s *server) shellExecute(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	var req shellExecuteRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Command = strings.TrimSpace(req.Command)
	if req.SessionID == 0 || req.Command == "" {
		writeError(w, http.StatusBadRequest, "session_id dan command is required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	var session shellSessionItem
	var createdAt time.Time
	var updatedAt time.Time
	err = s.db.QueryRow(
		`SELECT id, owner_email, site_target, target_kind, base_path, name, active, last_command, last_output, last_exit_code, created_at, updated_at
		 FROM panel_shell_sessions WHERE id = $1`,
		req.SessionID,
	).Scan(&session.ID, &session.OwnerEmail, &session.SiteTarget, &session.TargetKind, &session.BasePath, &session.Name, &session.Active, &session.LastCommand, &session.LastOutput, &session.LastExitCode, &createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "shell session not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load shell session")
		return
	}
	session.CreatedAt = createdAt.Format(time.RFC3339)
	session.UpdatedAt = updatedAt.Format(time.RFC3339)

	if !user.IsAdmin && !strings.EqualFold(session.OwnerEmail, user.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}
	if !session.Active {
		writeError(w, http.StatusBadRequest, "shell session is not active")
		return
	}
	if strings.TrimSpace(session.BasePath) == "" {
		writeError(w, http.StatusBadRequest, "base path is not available")
		return
	}
	if _, err := os.Stat(session.BasePath); err != nil {
		writeError(w, http.StatusNotFound, "shell folder not found")
		return
	}

	output, exitCode, err := s.runRestrictedShellCommand(session.BasePath, req.Command)
	if err != nil && output == "" {
		output = err.Error()
	}

	now := time.Now().UTC()
	_, _ = s.db.Exec(
		`INSERT INTO panel_shell_logs (session_id, command, output, exit_code, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		session.ID,
		req.Command,
		output,
		exitCode,
		now,
	)
	_, _ = s.db.Exec(
		`UPDATE panel_shell_sessions
		 SET last_command = $1, last_output = $2, last_exit_code = $3, updated_at = $4
		 WHERE id = $5`,
		req.Command,
		output,
		exitCode,
		now,
		session.ID,
	)

	writeJSON(w, http.StatusOK, map[string]any{
		"session_id": session.ID,
		"command":    req.Command,
		"output":     output,
		"exit_code":  exitCode,
	})
}

func (s *server) shellLogs(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	sessionID := int64(0)
	if raw := strings.TrimSpace(r.URL.Query().Get("session_id")); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil {
			sessionID = parsed
		}
	}
	if sessionID == 0 {
		writeError(w, http.StatusBadRequest, "session_id is required")
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	var ownerEmail string
	if err := s.db.QueryRow(`SELECT owner_email FROM panel_shell_sessions WHERE id = $1`, sessionID).Scan(&ownerEmail); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "shell session not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load shell logs")
		return
	}
	if !user.IsAdmin && !strings.EqualFold(ownerEmail, user.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	rows, err := s.db.Query(
		`SELECT id, session_id, command, output, exit_code, created_at
		 FROM panel_shell_logs WHERE session_id = $1 ORDER BY created_at DESC LIMIT 30`,
		sessionID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load shell logs")
		return
	}
	defer rows.Close()

	logs := make([]shellLogItem, 0)
	for rows.Next() {
		var item shellLogItem
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.SessionID, &item.Command, &item.Output, &item.ExitCode, &createdAt); err != nil {
			continue
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		logs = append(logs, item)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": logs})
}

func commandAvailable(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func isSupportedDatabaseEngine(engine string) bool {
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres", "mariadb", "mongodb":
		return true
	default:
		return false
	}
}

func databaseEnginePort(engine string) string {
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		return "5432"
	case "mariadb":
		return "3306"
	case "mongodb":
		return "27017"
	default:
		return ""
	}
}

func databaseConnectionURI(engine, host, port, dbName, username, password string) string {
	user := url.QueryEscape(username)
	pass := url.QueryEscape(password)
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, pass, host, port, dbName)
	case "mariadb":
		return fmt.Sprintf("mysql://%s:%s@%s:%s/%s", user, pass, host, port, dbName)
	case "mongodb":
		return fmt.Sprintf("mongodb://%s:%s@%s:%s/%s", user, pass, host, port, dbName)
	default:
		return ""
	}
}

func (s *server) databaseExists(engine, name string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(
		`SELECT EXISTS (SELECT 1 FROM panel_databases WHERE engine = $1 AND name = $2)`,
		strings.ToLower(strings.TrimSpace(engine)),
		normalizeDatabaseIdentifier(name),
	).Scan(&exists)
	return exists, err
}

func (s *server) provisionDatabase(engine, name, username, password string) error {
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		if !commandAvailable("createdb") || !commandAvailable("psql") {
			return errors.New("PostgreSQL tools are not available on the server")
		}
		if output, err := exec.Command("sudo", "-u", "postgres", "createdb", name).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to create database PostgreSQL: %s", strings.TrimSpace(string(output)))
		}
		sqlStmt := fmt.Sprintf("CREATE USER %s WITH PASSWORD '%s'; GRANT ALL PRIVILEGES ON DATABASE %s TO %s;", pqIdent(username), sqlQuote(password), pqIdent(name), pqIdent(username))
		if output, err := exec.Command("sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-c", sqlStmt).CombinedOutput(); err != nil {
			_, _ = exec.Command("sudo", "-u", "postgres", "dropdb", name).CombinedOutput()
			_, _ = exec.Command("sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-c", fmt.Sprintf("DROP USER IF EXISTS %s;", pqIdent(username))).CombinedOutput()
			return fmt.Errorf("failed to create user PostgreSQL: %s", strings.TrimSpace(string(output)))
		}
		return nil
	case "mariadb":
		if !commandAvailable("mysql") && !commandAvailable("mariadb") {
			return errors.New("MariaDB tools are not available on the server")
		}
		mysqlBin := "mysql"
		if !commandAvailable("mysql") {
			mysqlBin = "mariadb"
		}
		sqlStmt := fmt.Sprintf("CREATE DATABASE `%s`; CREATE USER '%s'@'localhost' IDENTIFIED BY '%s'; GRANT ALL PRIVILEGES ON `%s`.* TO '%s'@'localhost'; FLUSH PRIVILEGES;", name, username, sqlQuote(password), name, username)
		if output, err := exec.Command("sudo", mysqlBin, "-e", sqlStmt).CombinedOutput(); err != nil {
			_, _ = exec.Command("sudo", mysqlBin, "-e", fmt.Sprintf("DROP DATABASE IF EXISTS `%s`; DROP USER IF EXISTS '%s'@'localhost'; FLUSH PRIVILEGES;", name, username)).CombinedOutput()
			return fmt.Errorf("failed to create database MariaDB: %s", strings.TrimSpace(string(output)))
		}
		return nil
	case "mongodb":
		if !commandAvailable("mongosh") && !commandAvailable("mongo") {
			return errors.New("MongoDB tools are not available on the server")
		}
		shell := "mongosh"
		if !commandAvailable("mongosh") {
			shell = "mongo"
		}
		js := fmt.Sprintf(`const targetDb = db.getSiblingDB(%q); targetDb.createUser({user: %q, pwd: %q, roles:[{role:"readWrite", db:%q}]});`, name, username, password, name)
		if output, err := exec.Command("sudo", shell, "--quiet", "--eval", js).CombinedOutput(); err != nil {
			cleanupJS := fmt.Sprintf(`const targetDb = db.getSiblingDB(%q); try { targetDb.dropUser(%q); } catch (e) {} try { targetDb.dropDatabase(); } catch (e) {}` , name, username)
			_, _ = exec.Command("sudo", shell, "--quiet", "--eval", cleanupJS).CombinedOutput()
			return fmt.Errorf("failed to create database MongoDB: %s", strings.TrimSpace(string(output)))
		}
		return nil
	default:
		return errors.New("database engine is not supported")
	}
}

func (s *server) removeProvisionedDatabase(engine, name, username string) error {
	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		if !commandAvailable("dropdb") || !commandAvailable("psql") {
			return errors.New("PostgreSQL tools are not available on the server")
		}
		_, _ = exec.Command("sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-c", fmt.Sprintf("DROP DATABASE IF EXISTS %s;", pqIdent(name))).CombinedOutput()
		_, _ = exec.Command("sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-c", fmt.Sprintf("DROP USER IF EXISTS %s;", pqIdent(username))).CombinedOutput()
		return nil
	case "mariadb":
		if !commandAvailable("mysql") && !commandAvailable("mariadb") {
			return errors.New("MariaDB tools are not available on the server")
		}
		mysqlBin := "mysql"
		if !commandAvailable("mysql") {
			mysqlBin = "mariadb"
		}
		sqlStmt := fmt.Sprintf("DROP DATABASE IF EXISTS `%s`; DROP USER IF EXISTS '%s'@'localhost'; FLUSH PRIVILEGES;", name, username)
		if output, err := exec.Command("sudo", mysqlBin, "-e", sqlStmt).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to delete database MariaDB: %s", strings.TrimSpace(string(output)))
		}
		return nil
	case "mongodb":
		if !commandAvailable("mongosh") && !commandAvailable("mongo") {
			return errors.New("MongoDB tools are not available on the server")
		}
		shell := "mongosh"
		if !commandAvailable("mongosh") {
			shell = "mongo"
		}
		js := fmt.Sprintf(`const targetDb = db.getSiblingDB(%q); try { targetDb.dropUser(%q); } catch (e) {} try { targetDb.dropDatabase(); } catch (e) {}`, name, username)
		if output, err := exec.Command("sudo", shell, "--quiet", "--eval", js).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to delete database MongoDB: %s", strings.TrimSpace(string(output)))
		}
		return nil
	default:
		return errors.New("database engine is not supported")
	}
}

func pqIdent(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

func sqlQuote(value string) string {
	return strings.ReplaceAll(value, "'", "''")
}

func displayDNSRecordName(name, domain string) string {
	name = strings.TrimSuffix(strings.ToLower(strings.TrimSpace(name)), ".")
	domain = normalizeDomain(domain)
	if name == domain {
		return "@"
	}
	if strings.HasSuffix(name, "."+domain) {
		return strings.TrimSuffix(name, "."+domain)
	}
	return name
}

func subdomainLabelFromFullDomain(fullDomain, parentDomain string) string {
	fullDomain = normalizeDomain(fullDomain)
	parentDomain = normalizeDomain(parentDomain)
	if fullDomain == "" || parentDomain == "" {
		return ""
	}
	if fullDomain == parentDomain {
		return ""
	}
	if strings.HasSuffix(fullDomain, "."+parentDomain) {
		return strings.TrimSuffix(fullDomain, "."+parentDomain)
	}
	return normalizeSubdomainLabel(fullDomain)
}

func panelNameservers() []string {
	return []string{"ns1.diworkin.com", "ns2.diworkin.com"}
}

func normalizeHost(host string) string {
	return strings.TrimSuffix(strings.ToLower(strings.TrimSpace(host)), ".")
}

func (s *server) serverIP() string {
	if ip := strings.TrimSpace(s.publicIP); ip != "" {
		return ip
	}

	if ip, err := detectPublicIP(); err == nil {
		s.publicIP = ip
		return ip
	}

	return ""
}

func detectPublicIP() (string, error) {
	conn, err := net.DialTimeout("udp", "1.1.1.1:80", 2*time.Second)
	if err != nil {
		return "", err
	}
	defer conn.Close()

	localAddr, ok := conn.LocalAddr().(*net.UDPAddr)
	if !ok || localAddr.IP == nil {
		return "", errors.New("failed to detect public IP")
	}

	return localAddr.IP.String(), nil
}

func publicDNSResolver(server string) *net.Resolver {
	return &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{Timeout: 5 * time.Second}
			return d.DialContext(ctx, "udp", server)
		},
	}
}

func lookupNSRecords(domain string) ([]string, error) {
	domain = normalizeDomain(domain)
	if domain == "" {
		return nil, errors.New("domain is empty")
	}

	servers := []string{"1.1.1.1:53", "8.8.8.8:53"}
	var lastErr error
	for _, server := range servers {
		ctx, cancel := context.WithTimeout(context.Background(), 6*time.Second)
		resolver := publicDNSResolver(server)
		records, err := resolver.LookupNS(ctx, domain)
		cancel()
		if err != nil {
			lastErr = err
			continue
		}

		seen := make(map[string]struct{}, len(records))
		names := make([]string, 0, len(records))
		for _, record := range records {
			host := normalizeHost(record.Host)
			if host == "" {
				continue
			}
			if _, ok := seen[host]; ok {
				continue
			}
			seen[host] = struct{}{}
			names = append(names, host)
		}
		if len(names) > 0 {
			return names, nil
		}
	}

	if lastErr != nil {
		return nil, lastErr
	}
	return nil, errors.New("failed to read ns records")
}

func lookupHostIPs(host string) ([]string, error) {
	servers := []string{"1.1.1.1:53", "8.8.8.8:53"}
	var lastErr error
	for _, server := range servers {
		ctx, cancel := context.WithTimeout(context.Background(), 6*time.Second)
		resolver := publicDNSResolver(server)
		ips, err := resolver.LookupHost(ctx, host)
		cancel()
		if err != nil {
			lastErr = err
			continue
		}
		if len(ips) > 0 {
			return ips, nil
		}
	}

	if lastErr != nil {
		return nil, lastErr
	}
	return nil, errors.New("failed to read a record")
}

func containsString(values []string, target string) bool {
	target = normalizeHost(target)
	for _, value := range values {
		if normalizeHost(value) == target {
			return true
		}
	}
	return false
}

func (s *server) domainDelegationReady(domain string) (bool, []string, error) {
	domain = normalizeDomain(domain)
	expected := panelNameservers()
	nsRecords, err := lookupNSRecords(domain)
	if err != nil {
		return false, expected, err
	}

	for _, ns := range expected {
		if !containsString(nsRecords, ns) {
			return false, expected, nil
		}
	}

	if ip := s.serverIP(); ip != "" {
		for _, ns := range expected {
			ips, err := lookupHostIPs(ns)
			if err != nil {
				return false, expected, err
			}
			if !containsString(ips, ip) {
				return false, expected, nil
			}
		}
	}

	return true, expected, nil
}

func (s *server) domainSiteLive(domain string) (bool, error) {
	domain = normalizeDomain(domain)
	if domain == "" {
		return false, errors.New("domain is empty")
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	req, err := http.NewRequest(http.MethodGet, "http://"+domain, nil)
	if err != nil {
		return false, err
	}

	resp, err := client.Do(req)
	if err != nil {
		req, err = http.NewRequest(http.MethodGet, "https://"+domain, nil)
		if err != nil {
			return false, err
		}
		resp, err = client.Do(req)
		if err != nil {
			return false, err
		}
	}
	defer resp.Body.Close()

	return resp.StatusCode >= 200 && resp.StatusCode < 400, nil
}

func (s *server) canManagePanelDomain(user User, domain string) (bool, error) {
	if user.IsAdmin {
		return true, nil
	}

	var exists bool
	err := s.db.QueryRow(
		`SELECT EXISTS (
			SELECT 1 FROM panel_domains
			WHERE lower(domain) = lower($1) AND lower(owner_email) = lower($2)
		) OR EXISTS (
			SELECT 1 FROM panel_subdomains
			WHERE lower(full_domain) = lower($1) AND lower(owner_email) = lower($2)
		)`,
		normalizeDomain(domain),
		normalizeEmail(user.Email),
	).Scan(&exists)
	return exists, err
}

func (s *server) seedMailDomain(domain string) error {
	domain = normalizeDomain(domain)
	if domain == "" {
		return errors.New("domain is empty")
	}

	if _, err := s.mailDB.Exec(`INSERT INTO mail_domains (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, domain); err != nil {
		return fmt.Errorf("failed to prepare mail domain: %w", err)
	}

	if _, err := s.mailDB.Exec(
		`INSERT INTO mail_aliases (source, destination) VALUES
			($1, $2),
			($3, $2)
		 ON CONFLICT (source) DO UPDATE SET destination = EXCLUDED.destination`,
		"postmaster@"+domain,
		"admin@diworkin.com",
		"abuse@"+domain,
	); err != nil {
		return fmt.Errorf("failed to prepare mail alias: %w", err)
	}

	return nil
}

func (s *server) removeMailDomain(domain string) error {
	domain = normalizeDomain(domain)
	if domain == "" {
		return errors.New("domain is empty")
	}

	if _, err := s.mailDB.Exec(`DELETE FROM mail_aliases WHERE split_part(source, '@', 2) = $1`, domain); err != nil {
		return fmt.Errorf("failed to clean up mail alias: %w", err)
	}
	if _, err := s.mailDB.Exec(`DELETE FROM mail_users WHERE split_part(email, '@', 2) = $1`, domain); err != nil {
		return fmt.Errorf("failed to clean up mail mailbox: %w", err)
	}
	if _, err := s.mailDB.Exec(`DELETE FROM mail_domains WHERE name = $1`, domain); err != nil {
		return fmt.Errorf("failed to clean up mail domain: %w", err)
	}
	_ = os.RemoveAll(filepath.Join("/var/mail/vhosts", domain))
	return nil
}

func (s *server) backups(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listBackups(w, sess, r.URL.Query().Get("domain"))
	case http.MethodPost:
		s.createBackup(w, r, sess)
	case http.MethodDelete:
		s.deleteBackup(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listBackups(w http.ResponseWriter, sess sessionRow, domainFilter string) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT id, owner_email, rule_id, domain, scope, status, file_name, file_path, file_size, notes, created_by, created_at, updated_at
		FROM panel_backups`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, normalizeEmail(sess.Email))
	}
	if domainFilter = normalizeDomain(domainFilter); domainFilter != "" {
		if len(args) == 0 {
			query += ` WHERE lower(domain) = lower($1)`
			args = append(args, domainFilter)
		} else {
			query += ` AND lower(domain) = lower($2)`
			args = append(args, domainFilter)
		}
	}
	query += ` ORDER BY created_at DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load backups")
		return
	}
	defer rows.Close()

	items := make([]backupItem, 0)
	for rows.Next() {
		var item backupItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.OwnerEmail, &item.RuleID, &item.Domain, &item.Scope, &item.Status, &item.FileName, &item.FilePath, &item.FileSize, &item.Notes, &item.CreatedBy, &createdAt, &updatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read backup")
			return
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		item.DownloadURL = "/api/backups/download?id=" + url.QueryEscape(item.ID)
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"backups": items})
}

func (s *server) createBackup(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeBackupRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	summary, err := s.createDomainBackup(sess.Email, req.Domain, req.Scope, "", "manual")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "Backup created successfully.",
		"backup":  summary,
	})
}

func (s *server) deleteBackup(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.ID = strings.TrimSpace(req.ID)
	if req.ID == "" {
		writeError(w, http.StatusBadRequest, "backup id is required")
		return
	}

	var ownerEmail, filePath string
	if err := s.db.QueryRow(`SELECT owner_email, file_path FROM panel_backups WHERE id = $1`, req.ID).Scan(&ownerEmail, &filePath); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "backup not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read backup")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_backups WHERE id = $1`, req.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete backup")
		return
	}
	if filePath != "" {
		_ = os.Remove(filePath)
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Backup deleted successfully.",
	})
}

func (s *server) backupDownload(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	id := strings.TrimSpace(r.URL.Query().Get("id"))
	if id == "" {
		writeError(w, http.StatusBadRequest, "backup id is required")
		return
	}

	var ownerEmail, filePath, fileName string
	if err := s.db.QueryRow(`SELECT owner_email, file_path, file_name FROM panel_backups WHERE id = $1`, id).Scan(&ownerEmail, &filePath, &fileName); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "backup not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read backup")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if filePath == "" {
		writeError(w, http.StatusNotFound, "backup file is not available")
		return
	}

	w.Header().Set("Content-Type", "application/gzip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", fileName))
	http.ServeFile(w, r, filePath)
}

func (s *server) backupRules(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listBackupRules(w, sess, r.URL.Query().Get("domain"))
	case http.MethodPost:
		s.createBackupRule(w, r, sess)
	case http.MethodDelete:
		s.deleteBackupRule(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) listBackupRules(w http.ResponseWriter, sess sessionRow, domainFilter string) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT id, owner_email, domain, scope, frequency, hour, minute, retention_count, enabled, created_by, last_run_at, next_run_at, created_at, updated_at
		FROM panel_backup_rules`
	args := []any{}
	if !user.IsAdmin {
		query += ` WHERE lower(owner_email) = lower($1)`
		args = append(args, normalizeEmail(sess.Email))
	}
	if domainFilter = normalizeDomain(domainFilter); domainFilter != "" {
		if len(args) == 0 {
			query += ` WHERE lower(domain) = lower($1)`
			args = append(args, domainFilter)
		} else {
			query += ` AND lower(domain) = lower($2)`
			args = append(args, domainFilter)
		}
	}
	query += ` ORDER BY created_at DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load backup rules")
		return
	}
	defer rows.Close()

	items := make([]backupRuleItem, 0)
	for rows.Next() {
		var item backupRuleItem
		var lastRunAt sql.NullTime
		var nextRunAt sql.NullTime
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.OwnerEmail, &item.Domain, &item.Scope, &item.Frequency, &item.Hour, &item.Minute, &item.RetentionCount, &item.Enabled, &item.CreatedBy, &lastRunAt, &nextRunAt, &createdAt, &updatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read backup rule")
			return
		}
		if lastRunAt.Valid {
			item.LastRunAt = lastRunAt.Time.UTC().Format(time.RFC3339)
		}
		if nextRunAt.Valid {
			item.NextRunAt = nextRunAt.Time.UTC().Format(time.RFC3339)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"rules": items})
}

func (s *server) createBackupRule(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	var req backupRuleRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Scope = strings.ToLower(strings.TrimSpace(req.Scope))
	req.Frequency = strings.ToLower(strings.TrimSpace(req.Frequency))
	if req.Scope == "" {
		req.Scope = "site"
	}
	if req.Frequency == "" {
		req.Frequency = "daily"
	}
	switch req.Scope {
	case "site", "database", "full":
	default:
		writeError(w, http.StatusBadRequest, "backup scope is invalid")
		return
	}
	switch req.Frequency {
	case "daily", "weekly":
	default:
		writeError(w, http.StatusBadRequest, "backup frequency is invalid")
		return
	}
	if req.Domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}
	if req.Hour < 0 || req.Hour > 23 {
		writeError(w, http.StatusBadRequest, "backup hour is invalid")
		return
	}
	if req.Minute < 0 || req.Minute > 59 {
		writeError(w, http.StatusBadRequest, "backup minute is invalid")
		return
	}
	if req.RetentionCount <= 0 {
		req.RetentionCount = 7
	}
	if req.RetentionCount > 100 {
		req.RetentionCount = 100
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	domainItem, err := s.loadDomainItem(req.Domain)
	if err != nil {
		writeError(w, http.StatusNotFound, "domain not found")
		return
	}

	id, err := randomToken(12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create backup rule")
		return
	}

	now := time.Now().UTC()
	nextRun := computeNextBackupRun(req.Frequency, req.Hour, req.Minute, now)
	enabled := true
	if !req.Enabled {
		enabled = false
	}

	if _, err := s.db.Exec(
		`INSERT INTO panel_backup_rules (id, owner_email, domain, scope, frequency, hour, minute, retention_count, enabled, created_by, next_run_at, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		id,
		normalizeEmail(sess.Email),
		domainItem.Domain,
		req.Scope,
		req.Frequency,
		req.Hour,
		req.Minute,
		req.RetentionCount,
		enabled,
		normalizeEmail(sess.Email),
		nextRun,
		now,
		now,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save backup rule")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status": "created",
		"message": "Backup rule created successfully.",
		"rule": backupRuleItem{
			ID:            id,
			OwnerEmail:    normalizeEmail(sess.Email),
			Domain:        domainItem.Domain,
			Scope:         req.Scope,
			Frequency:     req.Frequency,
			Hour:          req.Hour,
			Minute:        req.Minute,
			RetentionCount: req.RetentionCount,
			Enabled:       enabled,
			CreatedBy:     normalizeEmail(sess.Email),
			CreatedAt:     now.Format(time.RFC3339),
			UpdatedAt:     now.Format(time.RFC3339),
			NextRunAt:     nextRun.Format(time.RFC3339),
		},
	})
}

func (s *server) deleteBackupRule(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.ID = strings.TrimSpace(req.ID)
	if req.ID == "" {
		writeError(w, http.StatusBadRequest, "backup rule id is required")
		return
	}

	var ownerEmail string
	if err := s.db.QueryRow(`SELECT owner_email FROM panel_backup_rules WHERE id = $1`, req.ID).Scan(&ownerEmail); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "backup rule not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read backup rule")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_backup_rules WHERE id = $1`, req.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete backup rule")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Backup rule deleted successfully.",
	})
}

func (s *server) runBackupScheduler() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	s.executeDueBackupRules()
	for range ticker.C {
		s.executeDueBackupRules()
	}
}

func (s *server) executeDueBackupRules() {
	rows, err := s.db.Query(
		`SELECT id, owner_email, domain, scope, frequency, hour, minute, retention_count, enabled, created_by, last_run_at, next_run_at, created_at, updated_at
		 FROM panel_backup_rules
		 WHERE enabled = TRUE AND next_run_at IS NOT NULL AND next_run_at <= NOW()
		 ORDER BY next_run_at ASC
		 LIMIT 10`,
	)
	if err != nil {
		log.Printf("backup scheduler query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var rule backupRuleItem
		var lastRunAt sql.NullTime
		var nextRunAt sql.NullTime
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&rule.ID, &rule.OwnerEmail, &rule.Domain, &rule.Scope, &rule.Frequency, &rule.Hour, &rule.Minute, &rule.RetentionCount, &rule.Enabled, &rule.CreatedBy, &lastRunAt, &nextRunAt, &createdAt, &updatedAt); err != nil {
			log.Printf("backup scheduler scan error: %v", err)
			continue
		}
		if lastRunAt.Valid {
			rule.LastRunAt = lastRunAt.Time.UTC().Format(time.RFC3339)
		}
		if nextRunAt.Valid {
			rule.NextRunAt = nextRunAt.Time.UTC().Format(time.RFC3339)
		}
		rule.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		rule.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		if err := s.processBackupRule(rule); err != nil {
			log.Printf("backup scheduler rule %s error: %v", rule.ID, err)
		}
	}
}

func (s *server) processBackupRule(rule backupRuleItem) error {
	_, err := s.createDomainBackup(rule.CreatedBy, rule.Domain, rule.Scope, rule.ID, "scheduled")
	if err != nil {
		nextRun := time.Now().UTC().Add(5 * time.Minute)
		_, _ = s.db.Exec(`UPDATE panel_backup_rules SET next_run_at = $2, updated_at = NOW() WHERE id = $1`, rule.ID, nextRun)
		return err
	}

	if err := s.enforceBackupRetention(rule.ID, rule.RetentionCount); err != nil {
		log.Printf("backup retention rule %s error: %v", rule.ID, err)
	}

	nextRun := computeNextBackupRun(rule.Frequency, rule.Hour, rule.Minute, time.Now().UTC())
	_, err = s.db.Exec(
		`UPDATE panel_backup_rules
		 SET last_run_at = $2, next_run_at = $3, updated_at = NOW()
		 WHERE id = $1`,
		rule.ID,
		time.Now().UTC(),
		nextRun,
	)
	return err
}

func (s *server) enforceBackupRetention(ruleID string, retention int) error {
	if retention <= 0 {
		return nil
	}

	rows, err := s.db.Query(
		`SELECT id, file_path
		 FROM panel_backups
		 WHERE rule_id = $1
		 ORDER BY created_at DESC, id DESC
		 OFFSET $2`,
		ruleID,
		retention,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		var filePath string
		if err := rows.Scan(&id, &filePath); err != nil {
			return err
		}
		if _, err := s.db.Exec(`DELETE FROM panel_backups WHERE id = $1`, id); err != nil {
			return err
		}
		if filePath != "" {
			_ = os.Remove(filePath)
		}
	}

	return nil
}

func computeNextBackupRun(frequency string, hour, minute int, now time.Time) time.Time {
	anchor := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, time.UTC)
	if anchor.After(now) {
		return anchor
	}

	switch strings.ToLower(strings.TrimSpace(frequency)) {
	case "weekly":
		return anchor.AddDate(0, 0, 7)
	default:
		return anchor.AddDate(0, 0, 1)
	}
}

func (s *server) createDomainBackup(createdBy, domain, scope, ruleID, origin string) (backupItem, error) {
	domain = normalizeDomain(domain)
	scope = strings.ToLower(strings.TrimSpace(scope))
	if scope == "" {
		scope = "site"
	}
	switch scope {
	case "site", "database", "full":
	default:
		return backupItem{}, errors.New("backup scope is invalid")
	}

	item, err := s.loadDomainItem(domain)
	if err != nil {
		return backupItem{}, err
	}

	if err := os.MkdirAll(filepath.Join(s.backupRoot, domain), 0755); err != nil {
		return backupItem{}, err
	}

	id, err := randomToken(12)
	if err != nil {
		return backupItem{}, err
	}

	ts := time.Now().UTC()
	fileName := fmt.Sprintf("%s-%s-%s.tar.gz", domain, scope, ts.Format("20060102T150405Z"))
	filePath := filepath.Join(s.backupRoot, domain, id+"-"+fileName)
	tmpRoot := filepath.Join(os.TempDir(), "diworkin-backup-"+id)
	if err := os.RemoveAll(tmpRoot); err != nil {
		return backupItem{}, err
	}
	if err := os.MkdirAll(tmpRoot, 0755); err != nil {
		return backupItem{}, err
	}
	defer os.RemoveAll(tmpRoot)

	notes := make([]string, 0, 2)
	if scope == "site" || scope == "full" {
		siteDir := filepath.Join(tmpRoot, "site")
		if err := copyDirectory(item.PublicPath, siteDir); err != nil {
			return backupItem{}, err
		}
		notes = append(notes, "site")
	}

	if scope == "database" || scope == "full" {
		dumpDir := filepath.Join(tmpRoot, "databases")
		if err := os.MkdirAll(dumpDir, 0755); err != nil {
			return backupItem{}, err
		}
		dbRows, err := s.db.Query(
			`SELECT engine, name, username, connection_uri, host, port
			 FROM panel_databases
			 WHERE lower(domain) = lower($1)
			 ORDER BY engine ASC, name ASC`,
			domain,
		)
		if err != nil {
			return backupItem{}, err
		}
		defer dbRows.Close()

		count := 0
		for dbRows.Next() {
			var engine, name, username, connectionURI, host, port string
			if err := dbRows.Scan(&engine, &name, &username, &connectionURI, &host, &port); err != nil {
				return backupItem{}, err
			}
			dumpPath := filepath.Join(dumpDir, fmt.Sprintf("%s-%s.dump", engine, name))
			if err := dumpDatabase(engine, name, username, connectionURI, host, port, dumpPath); err != nil {
				return backupItem{}, err
			}
			count++
		}
		notes = append(notes, fmt.Sprintf("db:%d", count))
	}

	if len(notes) == 0 {
		notes = append(notes, "empty")
	}

	if err := createTarGz(filePath, tmpRoot); err != nil {
		return backupItem{}, err
	}

	stat, err := os.Stat(filePath)
	if err != nil {
		return backupItem{}, err
	}

	summary := backupItem{
		ID:          id,
		RuleID:      strings.TrimSpace(ruleID),
		Domain:      domain,
		Scope:       scope,
		Status:      "ready",
		FileName:    fileName,
		FilePath:    filePath,
		FileSize:    stat.Size(),
		Notes:       strings.Join(notes, ", "),
		CreatedBy:   normalizeEmail(createdBy),
		CreatedAt:   ts.Format(time.RFC3339),
		UpdatedAt:   ts.Format(time.RFC3339),
		DownloadURL: "/api/backups/download?id=" + url.QueryEscape(id),
	}
	if origin = strings.TrimSpace(origin); origin != "" {
		if summary.Notes != "" {
			summary.Notes = origin + ", " + summary.Notes
		} else {
			summary.Notes = origin
		}
	}

	_, err = s.db.Exec(
		`INSERT INTO panel_backups (id, owner_email, rule_id, domain, scope, status, file_name, file_path, file_size, notes, created_by, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		id,
		normalizeEmail(createdBy),
		strings.TrimSpace(ruleID),
		domain,
		scope,
		summary.Status,
		summary.FileName,
		summary.FilePath,
		summary.FileSize,
		summary.Notes,
		summary.CreatedBy,
		ts,
		ts,
	)
	if err != nil {
		_ = os.Remove(filePath)
		return backupItem{}, err
	}

	return summary, nil
}

func createTarGz(targetFile, sourceDir string) error {
	file, err := os.Create(targetFile)
	if err != nil {
		return err
	}
	defer file.Close()

	gw := gzip.NewWriter(file)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	sourceDir = filepath.Clean(sourceDir)
	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			return nil
		}

		header, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		header.Name = filepath.ToSlash(relPath)
		if err := tw.WriteHeader(header); err != nil {
			return err
		}
		if info.Mode().IsRegular() {
			fp, err := os.Open(path)
			if err != nil {
				return err
			}
			defer fp.Close()
			if _, err := io.Copy(tw, fp); err != nil {
				return err
			}
		}
		return nil
	})
}

func copyDirectory(sourceDir, targetDir string) error {
	sourceDir = filepath.Clean(sourceDir)
	targetDir = filepath.Clean(targetDir)

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			return nil
		}

		destPath := filepath.Join(targetDir, relPath)
		if info.IsDir() {
			return os.MkdirAll(destPath, info.Mode().Perm())
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return err
		}

		src, err := os.Open(path)
		if err != nil {
			return err
		}
		defer src.Close()

		dst, err := os.Create(destPath)
		if err != nil {
			return err
		}
		if _, err := io.Copy(dst, src); err != nil {
			_ = dst.Close()
			return err
		}
		return dst.Close()
	})
}

func dumpDatabase(engine, name, username, connectionURI, host, port, dumpPath string) error {
	if err := os.MkdirAll(filepath.Dir(dumpPath), 0755); err != nil {
		return err
	}

	u, err := url.Parse(connectionURI)
	if err != nil {
		return err
	}
	password, _ := u.User.Password()

	switch strings.ToLower(strings.TrimSpace(engine)) {
	case "postgres":
		cmd := exec.Command("pg_dump", "-h", host, "-p", port, "-U", username, name)
		cmd.Env = append(os.Environ(), "PGPASSWORD="+password)
		out, err := os.Create(dumpPath)
		if err != nil {
			return err
		}
		defer out.Close()
		cmd.Stdout = out
		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to dump PostgreSQL %s: %s", name, strings.TrimSpace(stderr.String()))
		}
		return nil
	case "mariadb":
		cmd := exec.Command("mysqldump", "-h", host, "-P", port, "-u", username, fmt.Sprintf("--password=%s", password), name)
		out, err := os.Create(dumpPath)
		if err != nil {
			return err
		}
		defer out.Close()
		cmd.Stdout = out
		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to dump MariaDB %s: %s", name, strings.TrimSpace(stderr.String()))
		}
		return nil
	case "mongodb":
		cmd := exec.Command("mongodump", "--uri", connectionURI, "--archive="+dumpPath, "--gzip")
		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to dump MongoDB %s: %s", name, strings.TrimSpace(stderr.String()))
		}
		return nil
	default:
		return errors.New("database engine is not supported")
	}
}

func decodeBackupRequest(w http.ResponseWriter, r *http.Request) (backupRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req backupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return backupRequest{}, errors.New("invalid JSON body")
	}

	req.Domain = normalizeDomain(req.Domain)
	req.Scope = strings.ToLower(strings.TrimSpace(req.Scope))
	if req.Scope == "" {
		req.Scope = "site"
	}
	return req, nil
}

func (s *server) mailAccountExists(email string) (bool, error) {
	var exists bool
	err := s.mailDB.QueryRow(`SELECT EXISTS (SELECT 1 FROM mail_users WHERE email = $1)`, normalizeEmail(email)).Scan(&exists)
	return exists, err
}

func (s *server) lookupMailAccount(email string) (mailAccountSummary, string, error) {
	normalized := normalizeEmail(email)
	if normalized == "" {
		return mailAccountSummary{}, "", sql.ErrNoRows
	}

	var account mailAccountSummary
	var password string
	if err := s.mailDB.QueryRow(
		`SELECT email, password, enabled FROM mail_users WHERE lower(email) = lower($1)`,
		normalized,
	).Scan(&account.Email, &password, &account.Enabled); err != nil {
		return mailAccountSummary{}, "", err
	}

	account.DisplayName = account.Email
	parts := strings.SplitN(account.Email, "@", 2)
	if len(parts) != 2 {
		return mailAccountSummary{}, "", sql.ErrNoRows
	}
	account.LocalPart = parts[0]
	account.Domain = parts[1]
	account.Maildir = filepath.Join("/var/mail/vhosts", account.Domain, account.LocalPart, "Maildir")
	return account, password, nil
}

func (s *server) loadMailAccountSummary(email string) (mailAccountSummary, error) {
	account, _, err := s.lookupMailAccount(email)
	return account, err
}

func decodeMailAuthRequest(w http.ResponseWriter, r *http.Request) (mailAuthRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	var req mailAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return mailAuthRequest{}, errors.New("invalid JSON body")
	}
	req.Email = normalizeEmail(req.Email)
	req.Password = strings.TrimSpace(req.Password)
	if req.Email == "" || req.Password == "" {
		return mailAuthRequest{}, errors.New("email and password are required")
	}
	return req, nil
}

func decodeMailSendRequest(w http.ResponseWriter, r *http.Request) (mailSendRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 2<<20)
	defer r.Body.Close()

	var req mailSendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return mailSendRequest{}, errors.New("invalid JSON body")
	}
	req.To = strings.TrimSpace(req.To)
	req.Cc = strings.TrimSpace(req.Cc)
	req.Bcc = strings.TrimSpace(req.Bcc)
	req.Subject = strings.TrimSpace(req.Subject)
	req.HTML = strings.TrimSpace(req.HTML)
	req.Text = strings.TrimSpace(req.Text)
	return req, nil
}

func normalizeMailFolderName(name string) string {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "", "inbox":
		return "Inbox"
	case "sent":
		return "Sent"
	case "drafts", "draft":
		return "Drafts"
	case "archive", "archived":
		return "Archive"
	case "spam", "junk":
		return "Spam"
	case "trash", "deleted":
		return "Trash"
	case "starred", "star":
		return "Starred"
	default:
		return "Inbox"
	}
}

func mailFolderDirectory(maildir, folder string) string {
	switch normalizeMailFolderName(folder) {
	case "Inbox":
		return maildir
	case "Sent":
		return filepath.Join(maildir, ".Sent")
	case "Drafts":
		return filepath.Join(maildir, ".Drafts")
	case "Archive":
		return filepath.Join(maildir, ".Archive")
	case "Spam":
		return filepath.Join(maildir, ".Spam")
	case "Trash":
		return filepath.Join(maildir, ".Trash")
	case "Starred":
		return filepath.Join(maildir, ".Starred")
	default:
		return maildir
	}
}

type mailFileEntry struct {
	Path     string
	RelPath  string
	ModTime  time.Time
	Unread   bool
	Folder   string
}

func collectMailFolderEntries(baseDir string, folder string) ([]mailFileEntry, error) {
	folderDir := mailFolderDirectory(baseDir, folder)
	entries := make([]mailFileEntry, 0)
	for _, subdir := range []string{"new", "cur"} {
		dirPath := filepath.Join(folderDir, subdir)
		dirEntries, err := os.ReadDir(dirPath)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return nil, err
		}
		for _, item := range dirEntries {
			if item.IsDir() {
				continue
			}
			info, err := item.Info()
			if err != nil {
				continue
			}
			name := item.Name()
			unread := subdir == "new"
			if subdir == "cur" {
				unread = !strings.Contains(name, ":2,S")
			}
			relPath := filepath.ToSlash(filepath.Join(strings.TrimPrefix(folderDir, baseDir), subdir, name))
			if folderDir == baseDir {
				relPath = filepath.ToSlash(filepath.Join(subdir, name))
			}
			entries = append(entries, mailFileEntry{
				Path:    filepath.Join(dirPath, name),
				RelPath: relPath,
				ModTime: info.ModTime(),
				Unread:  unread,
				Folder:  normalizeMailFolderName(folder),
			})
		}
	}
	return entries, nil
}

func (s *server) mailFolderSummaries(maildir string) ([]mailFolderSummary, error) {
	folders := []string{"Inbox", "Sent", "Drafts", "Archive", "Spam", "Trash", "Starred"}
	items := make([]mailFolderSummary, 0, len(folders))
	for _, folder := range folders {
		entries, err := collectMailFolderEntries(maildir, folder)
		if err != nil {
			return nil, err
		}
		unreadCount := 0
		for _, entry := range entries {
			if entry.Unread {
				unreadCount++
			}
		}
		items = append(items, mailFolderSummary{
			Name:        folder,
			Label:       folder,
			Count:       len(entries),
			UnreadCount: unreadCount,
		})
	}
	return items, nil
}

func (s *server) mailFolderMessages(maildir, folder string, limit int) ([]mailMessageSummary, error) {
	entries, err := collectMailFolderEntries(maildir, folder)
	if err != nil {
		return nil, err
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].ModTime.After(entries[j].ModTime)
	})

	if limit > 0 && len(entries) > limit {
		entries = entries[:limit]
	}

	messages := make([]mailMessageSummary, 0, len(entries))
	for _, entry := range entries {
		detail, err := parseMailMessage(entry.Path)
		if err != nil {
			continue
		}
		messages = append(messages, mailMessageSummary{
			ID:             encodeMailMessageID(entry.RelPath),
			MessageID:      detail.MessageID,
			Folder:         entry.Folder,
			From:           detail.From,
			Subject:        detail.Subject,
			Preview:        detail.Preview,
			Time:           detail.Time,
			Timestamp:      detail.Timestamp,
			Size:           detail.Size,
			Unread:         entry.Unread,
			HasAttachments: len(detail.Attachments) > 0,
		})
	}
	return messages, nil
}

func (s *server) loadMailMessage(maildir, messageID string) (mailMessageDetail, error) {
	relPath, err := decodeMailMessageID(messageID)
	if err != nil {
		return mailMessageDetail{}, err
	}
	path := filepath.Join(maildir, filepath.FromSlash(relPath))
	cleaned := filepath.Clean(path)
	if !strings.HasPrefix(cleaned, filepath.Clean(maildir)+string(os.PathSeparator)) && cleaned != filepath.Clean(maildir) {
		return mailMessageDetail{}, errors.New("invalid message id")
	}
	detail, err := parseMailMessage(cleaned)
	if err != nil {
		return mailMessageDetail{}, err
	}
	detail.ID = messageID
	detail.Folder = mailFolderFromRelPath(relPath)
	return detail, nil
}

func mailFolderFromRelPath(relPath string) string {
	relPath = filepath.ToSlash(strings.TrimSpace(relPath))
	if relPath == "" {
		return "Inbox"
	}
	parts := strings.Split(relPath, "/")
	if len(parts) == 0 {
		return "Inbox"
	}
	if parts[0] == "cur" || parts[0] == "new" {
		return "Inbox"
	}
	if strings.HasPrefix(parts[0], ".") {
		return normalizeMailFolderName(strings.TrimPrefix(parts[0], "."))
	}
	return "Inbox"
}

func parseMailMessage(path string) (mailMessageDetail, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return mailMessageDetail{}, err
	}

	msg, err := mail.ReadMessage(bytes.NewReader(raw))
	if err != nil {
		return mailMessageDetail{}, err
	}

	info, err := os.Stat(path)
	if err != nil {
		info = nil
	}

	detail := mailMessageDetail{
		Size: int64(len(raw)),
		From: formatMailAddressHeader(msg.Header.Get("From")),
		To:   formatMailAddressHeader(msg.Header.Get("To")),
		Cc:   formatMailAddressHeader(msg.Header.Get("Cc")),
	}
	detail.Subject = decodeMailHeaderValue(msg.Header.Get("Subject"))
	detail.MessageID = strings.TrimSpace(strings.Trim(msg.Header.Get("Message-ID"), "<>"))
	if detail.MessageID == "" {
		detail.MessageID = strings.TrimSpace(msg.Header.Get("Message-ID"))
	}
	if parsed, err := mail.ParseAddress(msg.Header.Get("From")); err == nil {
		detail.From = parsed.String()
	}

	var parsedTime time.Time
	if headerDate := strings.TrimSpace(msg.Header.Get("Date")); headerDate != "" {
		if t, err := mail.ParseDate(headerDate); err == nil {
			parsedTime = t
		}
	}
	if parsedTime.IsZero() && info != nil {
		parsedTime = info.ModTime()
	}
	if parsedTime.IsZero() {
		parsedTime = time.Now()
	}
	detail.Time = parsedTime.Format("Jan 2, 3:04 PM")
	detail.Timestamp = parsedTime.Format(time.RFC3339)

	contentType := msg.Header.Get("Content-Type")
	parsed := parseMailBody(msg.Body, contentType, msg.Header)
	detail.HTML = parsed.HTML
	detail.Text = parsed.Text
	detail.Attachments = parsed.Attachments
	detail.Preview = buildMailPreview(detail.Text, detail.HTML)
	return detail, nil
}

type parsedMailBody struct {
	HTML        string
	Text        string
	Attachments []mailAttachmentSummary
}

func parseMailBody(reader io.Reader, contentType string, header map[string][]string) parsedMailBody {
	result := parsedMailBody{}
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil || mediaType == "" {
		mediaType = "text/plain"
	}

	switch {
	case strings.HasPrefix(mediaType, "multipart/"):
		boundary := params["boundary"]
		if boundary == "" {
			return result
		}
		mr := multipart.NewReader(reader, boundary)
		for {
			part, err := mr.NextPart()
			if err != nil {
				break
			}
			child := parseMailBody(part, part.Header.Get("Content-Type"), part.Header)
			if result.HTML == "" && child.HTML != "" {
				result.HTML = child.HTML
			}
			if result.Text == "" && child.Text != "" {
				result.Text = child.Text
			}
			if len(child.Attachments) > 0 {
				result.Attachments = append(result.Attachments, child.Attachments...)
			}
		}
		if result.HTML != "" && (result.Text == "" || looksLikeMailSource(result.Text)) {
			result.Text = stripHTMLToText(result.HTML)
		}
		if result.Text != "" && looksLikeMailSource(result.Text) {
			if cleaned := cleanMailSourceText(result.Text); cleaned != "" {
				result.Text = cleaned
			}
		}
	default:
		payload, _ := io.ReadAll(reader)
		body := decodeMailBodyPayload(payload, headerValue(header, "Content-Transfer-Encoding"))
		disposition, dispParams, _ := mime.ParseMediaType(headerValue(header, "Content-Disposition"))
		filename := strings.TrimSpace(dispParams["filename"])
		if filename == "" {
			filename = strings.TrimSpace(headerValue(header, "Filename"))
		}
		if filename == "" {
			filename = strings.TrimSpace(headerValue(header, "Name"))
		}
		if strings.EqualFold(disposition, "attachment") || filename != "" && strings.Contains(strings.ToLower(disposition), "attachment") {
			result.Attachments = append(result.Attachments, mailAttachmentSummary{
				Name:        decodeMailHeaderValue(filename),
				ContentType: mediaType,
				Size:        int64(len(payload)),
			})
			return result
		}
		switch {
		case strings.Contains(mediaType, "html"):
			result.HTML = body
		default:
			result.Text = body
		}
	}

	return result
}

func looksLikeMailSource(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return false
	}

	score := 0
	if strings.Contains(value, "@font-face") {
		score++
	}
	if strings.Contains(value, "externalclass") {
		score++
	}
	if strings.Contains(value, "mso-") {
		score++
	}
	if strings.Contains(value, "<!doctype") || strings.Contains(value, "<html") {
		score++
	}
	if strings.Contains(value, "content-type: text/html") {
		score++
	}
	if strings.Count(value, "=20") > 5 {
		score++
	}
	return score >= 2
}

func cleanMailSourceText(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	value = regexp.MustCompile(`(?is)/\*.*?\*/`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?is)@font-face\s*\{.*?\}`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?is)@media\s+screen\s*\{.*?\}`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?is)\.ExternalClass.*?\}`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?is)#outlook a\s*\{.*?\}`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?is)<style[^>]*>.*?</style>`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?is)<script[^>]*>.*?</script>`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?i)content-type:\s*text/html`).ReplaceAllString(value, " ")
	value = regexp.MustCompile(`(?i)=([0-9a-f]{2})`).ReplaceAllString(value, " ")

	lines := strings.Split(strings.ReplaceAll(value, "\r\n", "\n"), "\n")
	kept := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		lower := strings.ToLower(line)
		switch {
		case strings.HasPrefix(lower, "@"):
			continue
		case strings.HasPrefix(lower, ".externalclass"):
			continue
		case strings.HasPrefix(lower, "body {"):
			continue
		case strings.HasPrefix(lower, "table {"):
			continue
		case strings.HasPrefix(lower, "img {"):
			continue
		case strings.HasPrefix(lower, "#outlook"):
			continue
		case strings.Contains(lower, "{") && strings.Contains(lower, "}"):
			continue
		}
		kept = append(kept, line)
	}
	if len(kept) > 0 {
		return strings.Join(kept, " ")
	}
	return strings.Join(strings.Fields(value), " ")
}

func decodeMailBodyPayload(payload []byte, encoding string) string {
	encoding = strings.ToLower(strings.TrimSpace(encoding))
	if len(payload) == 0 {
		return ""
	}

	switch encoding {
	case "base64":
		decoded, err := io.ReadAll(base64.NewDecoder(base64.StdEncoding, bytes.NewReader(payload)))
		if err == nil {
			payload = decoded
		}
	case "quoted-printable":
		decoded, err := io.ReadAll(quotedprintable.NewReader(bytes.NewReader(payload)))
		if err == nil {
			payload = decoded
		}
	}

	return string(payload)
}

func headerValue(header map[string][]string, key string) string {
	if header == nil {
		return ""
	}
	values := header[key]
	if len(values) == 0 {
		for existingKey, existingValues := range header {
			if strings.EqualFold(existingKey, key) && len(existingValues) > 0 {
				return existingValues[0]
			}
		}
		return ""
	}
	return values[0]
}

func buildMailPreview(textBody, htmlBody string) string {
	previewSource := strings.TrimSpace(textBody)
	if previewSource == "" || looksLikeMailSource(previewSource) {
		previewSource = stripHTMLToText(htmlBody)
	}
	if looksLikeMailSource(previewSource) {
		previewSource = cleanMailSourceText(previewSource)
	}
	previewSource = strings.Join(strings.Fields(strings.ReplaceAll(previewSource, "\n", " ")), " ")
	if len(previewSource) > 160 {
		previewSource = previewSource[:160] + "..."
	}
	return previewSource
}

func formatMailAddressHeader(value string) string {
	value = decodeMailHeaderValue(value)
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	return value
}

func decodeMailHeaderValue(value string) string {
	decoder := mime.WordDecoder{}
	decoded, err := decoder.DecodeHeader(strings.TrimSpace(value))
	if err != nil {
		return strings.TrimSpace(value)
	}
	return strings.TrimSpace(decoded)
}

func collectMailRecipients(values ...string) []string {
	recipients := make([]string, 0)
	seen := map[string]struct{}{}
	for _, raw := range values {
		raw = strings.TrimSpace(raw)
		if raw == "" {
			continue
		}
		addrs, err := mail.ParseAddressList(raw)
		if err != nil {
			if addr := normalizeEmail(raw); addr != "" {
				if _, ok := seen[addr]; !ok {
					seen[addr] = struct{}{}
					recipients = append(recipients, addr)
				}
			}
			continue
		}
		for _, addr := range addrs {
			normalized := normalizeEmail(addr.Address)
			if normalized == "" {
				continue
			}
			if _, ok := seen[normalized]; ok {
				continue
			}
			seen[normalized] = struct{}{}
			recipients = append(recipients, normalized)
		}
	}
	return recipients
}

func formatMailRecipientList(recipients []string) string {
	filtered := make([]string, 0, len(recipients))
	for _, recipient := range recipients {
		recipient = strings.TrimSpace(recipient)
		if recipient != "" {
			filtered = append(filtered, recipient)
		}
	}
	return strings.Join(filtered, ", ")
}

func wrapPlainTextAsHTML(text string) string {
	escaped := html.EscapeString(text)
	escaped = strings.ReplaceAll(escaped, "\r\n", "\n")
	escaped = strings.ReplaceAll(escaped, "\n", "<br>")
	return "<!doctype html><html><body>" + escaped + "</body></html>"
}

func stripHTMLToText(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	reStyle := regexp.MustCompile(`(?is)<style[^>]*>.*?</style>`)
	value = reStyle.ReplaceAllString(value, " ")
	reScript := regexp.MustCompile(`(?is)<script[^>]*>.*?</script>`)
	value = reScript.ReplaceAllString(value, " ")
	re := regexp.MustCompile(`(?s)<[^>]+>`)
	value = re.ReplaceAllString(value, " ")
	value = html.UnescapeString(value)
	value = strings.Join(strings.Fields(strings.ReplaceAll(value, "\r\n", " ")), " ")
	return value
}

func encodeMailMessageID(relPath string) string {
	return base64.RawURLEncoding.EncodeToString([]byte(relPath))
}

func decodeMailMessageID(id string) (string, error) {
	raw, err := base64.RawURLEncoding.DecodeString(id)
	if err != nil {
		return "", err
	}
	relPath := filepath.ToSlash(strings.TrimSpace(string(raw)))
	if relPath == "" || strings.Contains(relPath, "..") {
		return "", errors.New("invalid message id")
	}
	return relPath, nil
}

func verifyMailPasswordHash(storedHash, password string) (bool, error) {
	storedHash = strings.TrimSpace(storedHash)
	if storedHash == "" || !strings.HasPrefix(storedHash, "$6$") {
		return false, nil
	}

	parts := strings.Split(storedHash, "$")
	if len(parts) < 4 {
		return false, nil
	}
	salt := parts[2]
	if strings.HasPrefix(salt, "rounds=") && len(parts) >= 5 {
		salt = strings.Join(parts[2:4], "$")
	}

	cmd := exec.Command("openssl", "passwd", "-6", "-salt", salt, password)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, fmt.Errorf("openssl passwd failed: %s", strings.TrimSpace(string(output)))
	}
	return subtle.ConstantTimeCompare(bytes.TrimSpace(output), []byte(storedHash)) == 1, nil
}

func (s *server) createMailSession(email string) (string, time.Time, error) {
	token, err := randomToken(32)
	if err != nil {
		return "", time.Time{}, err
	}

	expiresAt := time.Now().Add(mailSessionTTL)
	tokenHash := s.hashToken(token)

	_, err = s.mailDB.Exec(
		`INSERT INTO mail_sessions (token_hash, email, expires_at) VALUES ($1, $2, $3)
		 ON CONFLICT (token_hash) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at, last_seen_at = NOW()`,
		tokenHash,
		normalizeEmail(email),
		expiresAt,
	)
	if err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

func (s *server) issueMailSSOToken(email string) (string, error) {
	secret := strings.TrimSpace(s.sessionSecret)
	if secret == "" {
		return "", errors.New("session secret is not available")
	}

	payload := struct {
		Email string `json:"email"`
		Exp   int64  `json:"exp"`
		Nonce string `json:"nonce"`
	}{
		Email: normalizeEmail(email),
		Exp:   time.Now().UTC().Add(mailSSOTokenTTL).Unix(),
	}
	var err error
	payload.Nonce, err = randomToken(12)
	if err != nil {
		return "", err
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(raw)
	sig := mac.Sum(nil)
	return base64.RawURLEncoding.EncodeToString(raw) + "." + base64.RawURLEncoding.EncodeToString(sig), nil
}

func (s *server) verifyMailSSOToken(token string) (string, error) {
	secret := strings.TrimSpace(s.sessionSecret)
	if secret == "" {
		return "", errors.New("session secret is not available")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", errors.New("invalid mail access token")
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", errors.New("invalid mail access token")
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", errors.New("invalid mail access token")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(raw)
	expected := mac.Sum(nil)
	if subtle.ConstantTimeCompare(sig, expected) != 1 {
		return "", errors.New("invalid mail access token")
	}
	var payload struct {
		Email string `json:"email"`
		Exp   int64  `json:"exp"`
		Nonce string `json:"nonce"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return "", errors.New("invalid mail access token")
	}
	if payload.Email == "" || time.Now().UTC().Unix() > payload.Exp {
		return "", errors.New("mail access token expired")
	}
	return normalizeEmail(payload.Email), nil
}

func (s *server) setMailSessionCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	cookie := &http.Cookie{
		Name:     mailAuthCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
	if domain := strings.TrimSpace(s.mailCookieDomain); domain != "" {
		cookie.Domain = domain
	}
	http.SetCookie(w, cookie)
}

func (s *server) clearMailSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     mailAuthCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
	if domain := strings.TrimSpace(s.mailCookieDomain); domain != "" {
		cookie.Domain = domain
	}
	http.SetCookie(w, cookie)
}

func buildMailMessage(fromHeader string, toHeader string, ccHeader string, subject string, htmlBody string, textBody string) ([]byte, error) {
	boundary, err := randomToken(12)
	if err != nil {
		return nil, err
	}
	messageToken, err := randomToken(16)
	if err != nil {
		return nil, err
	}

	var builder strings.Builder
	builder.WriteString("From: ")
	builder.WriteString(strings.TrimSpace(fromHeader))
	builder.WriteString("\r\n")
	if strings.TrimSpace(toHeader) != "" {
		builder.WriteString("To: ")
		builder.WriteString(strings.TrimSpace(toHeader))
		builder.WriteString("\r\n")
	}
	if strings.TrimSpace(ccHeader) != "" {
		builder.WriteString("Cc: ")
		builder.WriteString(strings.TrimSpace(ccHeader))
		builder.WriteString("\r\n")
	}
	builder.WriteString("Subject: ")
	builder.WriteString(strings.TrimSpace(subject))
	builder.WriteString("\r\n")
	builder.WriteString("Date: ")
	builder.WriteString(time.Now().Format(time.RFC1123Z))
	builder.WriteString("\r\n")
	builder.WriteString("Message-ID: <")
	builder.WriteString(messageToken)
	builder.WriteString("@diworkin.com>\r\n")
	builder.WriteString("MIME-Version: 1.0\r\n")
	builder.WriteString("Content-Type: multipart/alternative; boundary=\"")
	builder.WriteString(boundary)
	builder.WriteString("\"\r\n\r\n")
	builder.WriteString("--")
	builder.WriteString(boundary)
	builder.WriteString("\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\nContent-Transfer-Encoding: 7bit\r\n\r\n")
	builder.WriteString(textBody)
	builder.WriteString("\r\n--")
	builder.WriteString(boundary)
	builder.WriteString("\r\nContent-Type: text/html; charset=\"UTF-8\"\r\nContent-Transfer-Encoding: 7bit\r\n\r\n")
	builder.WriteString(htmlBody)
	builder.WriteString("\r\n--")
	builder.WriteString(boundary)
	builder.WriteString("--\r\n")

	return []byte(builder.String()), nil
}

func (s *server) sendMailMessage(envelopeFrom, fromHeader string, toHeader []string, ccHeader []string, recipients []string, subject, htmlBody, textBody string) error {
	fromHeader = strings.TrimSpace(fromHeader)
	if fromHeader == "" {
		fromHeader = envelopeFrom
	}

	message, err := buildMailMessage(fromHeader, formatMailRecipientList(toHeader), formatMailRecipientList(ccHeader), subject, htmlBody, textBody)
	if err != nil {
		return err
	}

	addr := net.JoinHostPort(s.smtpHost, s.smtpPort)
	var auth smtp.Auth
	if s.smtpUsername != "" {
		auth = smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	}

	client, err := smtp.Dial(addr)
	if err != nil {
		return err
	}
	defer client.Close()

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(strings.TrimSpace(envelopeFrom)); err != nil {
		return err
	}
	for _, recipient := range recipients {
		if err := client.Rcpt(strings.TrimSpace(recipient)); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(message); err != nil {
		_ = writer.Close()
		return err
	}
	return writer.Close()
}

func (s *server) saveSentCopy(maildir, fromEmail string, toHeader []string, ccHeader []string, subject, htmlBody, textBody string) error {
	sentDir := filepath.Join(maildir, ".Sent")
	for _, dir := range []string{sentDir, filepath.Join(sentDir, "cur"), filepath.Join(sentDir, "new"), filepath.Join(sentDir, "tmp")} {
		if err := os.MkdirAll(dir, 0700); err != nil {
			return err
		}
	}

	message, err := buildMailMessage(fromEmail, formatMailRecipientList(toHeader), formatMailRecipientList(ccHeader), subject, htmlBody, textBody)
	if err != nil {
		return err
	}

	token, err := randomToken(10)
	if err != nil {
		return err
	}
	fileName := fmt.Sprintf("%d.%s.eml:2,S", time.Now().UnixNano(), token)
	filePath := filepath.Join(sentDir, "cur", fileName)
	return os.WriteFile(filePath, message, 0600)
}

func generateMailPasswordHash(password string) (string, error) {
	salt, err := randomToken(8)
	if err != nil {
		return "", err
	}

	cmd := exec.Command("openssl", "passwd", "-6", "-salt", salt, password)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("openssl passwd failed: %s", strings.TrimSpace(string(output)))
	}

	return strings.TrimSpace(string(output)), nil
}

func (s *server) mailAccessKey() ([]byte, error) {
	secret := strings.TrimSpace(s.sessionSecret)
	if secret == "" {
		return nil, errors.New("session secret is not available")
	}
	sum := sha256.Sum256([]byte(secret))
	key := make([]byte, len(sum))
	copy(key, sum[:])
	return key, nil
}

func (s *server) encryptMailAccessSecret(value string) (string, error) {
	key, err := s.mailAccessKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nil, nonce, []byte(value), []byte("diworkin-mail-access"))
	payload := append(nonce, ciphertext...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

func (s *server) decryptMailAccessSecret(value string) (string, error) {
	key, err := s.mailAccessKey()
	if err != nil {
		return "", err
	}
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(value))
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(raw) < gcm.NonceSize() {
		return "", errors.New("invalid mail access data")
	}
	nonce := raw[:gcm.NonceSize()]
	ciphertext := raw[gcm.NonceSize():]
	plain, err := gcm.Open(nil, nonce, ciphertext, []byte("diworkin-mail-access"))
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func (s *server) saveMailAccessSecret(email, password string) error {
	enc, err := s.encryptMailAccessSecret(password)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(
		`INSERT INTO panel_mail_access_cache (email, password_enc, updated_at)
		 VALUES ($1, $2, NOW())
		 ON CONFLICT (email) DO UPDATE SET password_enc = EXCLUDED.password_enc, updated_at = NOW()`,
		normalizeEmail(email),
		enc,
	)
	return err
}

func (s *server) deleteMailAccessSecret(email string) {
	_, _ = s.db.Exec(`DELETE FROM panel_mail_access_cache WHERE lower(email) = lower($1)`, normalizeEmail(email))
}

func (s *server) encryptWordPressSecret(value string) (string, error) {
	key, err := s.mailAccessKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nil, nonce, []byte(value), []byte("diworkin-wordpress-admin"))
	payload := append(nonce, ciphertext...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

func (s *server) decryptWordPressSecret(value string) (string, error) {
	key, err := s.mailAccessKey()
	if err != nil {
		return "", err
	}
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(value))
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(raw) < gcm.NonceSize() {
		return "", errors.New("invalid WordPress data")
	}
	nonce := raw[:gcm.NonceSize()]
	ciphertext := raw[gcm.NonceSize():]
	plain, err := gcm.Open(nil, nonce, ciphertext, []byte("diworkin-wordpress-admin"))
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func (s *server) saveWordPressAccess(targetKind, domain, subdomain, adminUser, password string) error {
	if strings.TrimSpace(password) == "" {
		return errors.New("password wordpress kosong")
	}
	enc, err := s.encryptWordPressSecret(password)
	if err != nil {
		return err
	}
	targetKind = strings.ToLower(strings.TrimSpace(targetKind))
	switch targetKind {
	case "domain":
		_, err = s.db.Exec(
			`UPDATE panel_domains
			 SET app_type = 'wordpress',
			     wordpress_admin_user = $2,
			     wordpress_admin_pass_enc = $3,
			     updated_at = NOW()
			 WHERE lower(domain) = lower($1)`,
			normalizeDomain(domain),
			strings.TrimSpace(adminUser),
			enc,
		)
		return err
	case "subdomain":
		_, err = s.db.Exec(
			`UPDATE panel_subdomains
			 SET app_type = 'wordpress',
			     wordpress_admin_user = $3,
			     wordpress_admin_pass_enc = $4,
			     updated_at = NOW()
			 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
			normalizeDomain(domain),
			normalizeSubdomainLabel(subdomain),
			strings.TrimSpace(adminUser),
			enc,
		)
		return err
	default:
		return errors.New("invalid WordPress target")
	}
}

func (s *server) getWordPressCredentials(targetKind, domain, subdomain string) (string, string, bool, error) {
	targetKind = strings.ToLower(strings.TrimSpace(targetKind))
	switch targetKind {
	case "domain":
		var adminUser, adminPassEnc string
		if err := s.db.QueryRow(
			`SELECT wordpress_admin_user, wordpress_admin_pass_enc
			 FROM panel_domains
			 WHERE lower(domain) = lower($1)`,
			normalizeDomain(domain),
		).Scan(&adminUser, &adminPassEnc); err != nil {
			return "", "", false, err
		}
		if strings.TrimSpace(adminPassEnc) == "" {
			return strings.TrimSpace(adminUser), "", false, nil
		}
		pass, err := s.decryptWordPressSecret(adminPassEnc)
		if err != nil {
			return "", "", false, err
		}
		return strings.TrimSpace(adminUser), pass, true, nil
	case "subdomain":
		var adminUser, adminPassEnc string
		if err := s.db.QueryRow(
			`SELECT wordpress_admin_user, wordpress_admin_pass_enc
			 FROM panel_subdomains
			 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
			normalizeDomain(domain),
			normalizeSubdomainLabel(subdomain),
		).Scan(&adminUser, &adminPassEnc); err != nil {
			return "", "", false, err
		}
		if strings.TrimSpace(adminPassEnc) == "" {
			return strings.TrimSpace(adminUser), "", false, nil
		}
		pass, err := s.decryptWordPressSecret(adminPassEnc)
		if err != nil {
			return "", "", false, err
		}
		return strings.TrimSpace(adminUser), pass, true, nil
	default:
		return "", "", false, errors.New("invalid WordPress target")
	}
}

func (s *server) resolveWordPressAdminUser(publicPath string) (string, error) {
	wpCLI, err := ensureWpCLI()
	if err != nil {
		return "", err
	}
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return "", errors.New("path wordpress kosong")
	}
	args := []string{
		"--allow-root",
		"--path=" + publicPath,
		"user",
		"list",
		"--role=administrator",
		"--field=user_login",
	}
	output, err := exec.Command(wpCLI, args...).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to read admin wordpress: %s", strings.TrimSpace(string(output)))
	}
	for _, line := range strings.Split(strings.TrimSpace(string(output)), "\n") {
		if login := strings.TrimSpace(line); login != "" {
			return login, nil
		}
	}
	return "", errors.New("WordPress administrator user not found")
}

func (s *server) updateWordPressAdminPassword(publicPath, adminUser, password string) (string, error) {
	wpCLI, err := ensureWpCLI()
	if err != nil {
		return "", err
	}
	adminUser = strings.TrimSpace(adminUser)
	password = strings.TrimSpace(password)
	if adminUser == "" {
		return "", errors.New("username wordpress kosong")
	}
	if password == "" {
		return "", errors.New("password wordpress kosong")
	}

	tryUpdate := func(login string) error {
		args := []string{
			"--allow-root",
			"--path=" + publicPath,
			"user",
			"update",
			login,
			"--user_pass=" + password,
		}
		if output, err := exec.Command(wpCLI, args...).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to update password wordpress: %s", strings.TrimSpace(string(output)))
		}
		return nil
	}

	if err := tryUpdate(adminUser); err == nil {
		return adminUser, nil
	} else {
		lowerErr := strings.ToLower(err.Error())
		if !strings.Contains(lowerErr, "no valid users found") &&
			!strings.Contains(lowerErr, "invalid user id") &&
			!strings.Contains(lowerErr, "user not found") {
			return "", err
		}
	}

	fallbackUser, fallbackErr := s.resolveWordPressAdminUser(publicPath)
	if fallbackErr != nil {
		return "", fallbackErr
	}
	if fallbackUser == "" {
		return "", errors.New("WordPress administrator user not found")
	}
	if err := tryUpdate(fallbackUser); err != nil {
		return "", err
	}
	return fallbackUser, nil
}

func (s *server) ensureMailboxStorage(email string) error {
	parts := strings.SplitN(normalizeEmail(email), "@", 2)
	if len(parts) != 2 {
		return errors.New("invalid email")
	}

	vmailUser, err := user.Lookup("vmail")
	if err != nil {
		return fmt.Errorf("vmail user not found: %w", err)
	}
	vmailGroup, err := user.LookupGroup("vmail")
	if err != nil {
		return fmt.Errorf("vmail group not found: %w", err)
	}

	uid, err := strconv.Atoi(vmailUser.Uid)
	if err != nil {
		return err
	}
	gid, err := strconv.Atoi(vmailGroup.Gid)
	if err != nil {
		return err
	}

	root := "/var/mail/vhosts"
	userDir := filepath.Join(root, parts[1], parts[0])
	maildir := filepath.Join(userDir, "Maildir")
	for _, dir := range []string{
		filepath.Join(root, parts[1]),
		userDir,
		maildir,
		filepath.Join(maildir, "cur"),
		filepath.Join(maildir, "new"),
		filepath.Join(maildir, "tmp"),
	} {
		if err := os.MkdirAll(dir, 0750); err != nil {
			return err
		}
		if err := os.Chown(dir, uid, gid); err != nil {
			return err
		}
	}

	return nil
}

func (s *server) domainExists(domain string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(`SELECT EXISTS (SELECT 1 FROM panel_domains WHERE lower(domain) = lower($1))`, normalizeDomain(domain)).Scan(&exists)
	return exists, err
}

func (s *server) domainPublicPath(domain string) string {
	return filepath.Join(s.sitesRoot, normalizeDomain(domain), "public")
}

func (s *server) saveDomain(domain, projectName, appType, ownerEmail, publicPath string) error {
	_, err := s.db.Exec(
		`INSERT INTO panel_domains (owner_email, domain, project_name, app_type, public_path)
		 VALUES ($1, $2, $3, $4, $5)`,
		normalizeEmail(ownerEmail),
		normalizeDomain(domain),
		strings.TrimSpace(projectName),
		strings.ToLower(strings.TrimSpace(appType)),
		publicPath,
	)
	return err
}

func (s *server) loadDomainItem(domain string) (domainItem, error) {
	var item domainItem
	var createdAt time.Time
	var updatedAt time.Time
	var provisionedAt time.Time

	err := s.db.QueryRow(
		`SELECT owner_email, domain, project_name, app_type, public_path, wordpress_admin_user, (wordpress_admin_pass_enc <> '') AS wordpress_access_ready, created_at, updated_at, provisioned_at
		 FROM panel_domains
		 WHERE lower(domain) = lower($1)`,
		normalizeDomain(domain),
	).Scan(&item.OwnerEmail, &item.Domain, &item.ProjectName, &item.AppType, &item.PublicPath, &item.WordPressAdminUser, &item.WordPressAccessReady, &createdAt, &updatedAt, &provisionedAt)
	if err != nil {
		return domainItem{}, err
	}

	item.ServerIP = s.serverIP()
	item.CreatedAt = createdAt.Format(time.RFC3339)
	item.UpdatedAt = updatedAt.Format(time.RFC3339)
	item.ProvisionedAt = provisionedAt.Format(time.RFC3339)
	item.Nameservers = panelNameservers()
	ok, _, err := s.domainDelegationReady(item.Domain)
	if err == nil && ok {
		item.DNSStatus = "ready"
	} else {
		item.DNSStatus = "pending"
	}
	if item.DNSStatus == "ready" {
		if reachable, err := s.domainSiteLive(item.Domain); err == nil && reachable {
			item.SiteStatus = "live"
		} else {
			item.SiteStatus = "offline"
		}
	} else {
		item.SiteStatus = "waiting_dns"
	}
	if strings.EqualFold(item.AppType, "wordpress") {
		item.WordPressFilesystemMode = s.wordpressFilesystemMode(item.PublicPath)
	}

	return item, nil
}

func (s *server) subdomainPublicPath(domain, subdomain string) string {
	return filepath.Join(s.sitesRoot, normalizeDomain(domain), "subdomains", normalizeSubdomainLabel(subdomain), "public")
}

func (s *server) subdomainExists(domain, subdomain string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(
		`SELECT EXISTS (
			SELECT 1 FROM panel_subdomains
			WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)
		)`,
		normalizeDomain(domain),
		normalizeSubdomainLabel(subdomain),
	).Scan(&exists)
	return exists, err
}

func (s *server) saveSubdomain(domain, subdomain, projectName, appType, ownerEmail, publicPath, fullDomain, dbName, dbUser, connectionURI string) error {
	_, err := s.db.Exec(
		`INSERT INTO panel_subdomains (owner_email, domain, subdomain, full_domain, project_name, app_type, public_path, database_name, database_username, connection_uri)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		normalizeEmail(ownerEmail),
		normalizeDomain(domain),
		normalizeSubdomainLabel(subdomain),
		normalizeDomain(fullDomain),
		strings.TrimSpace(projectName),
		strings.ToLower(strings.TrimSpace(appType)),
		publicPath,
		strings.TrimSpace(dbName),
		strings.TrimSpace(dbUser),
		strings.TrimSpace(connectionURI),
	)
	return err
}

func (s *server) saveProvisionedDatabase(ownerEmail, domain, engine, name, username, connectionURI string) error {
	if strings.TrimSpace(connectionURI) == "" || strings.TrimSpace(name) == "" || strings.TrimSpace(username) == "" {
		return nil
	}

	var exists bool
	if err := s.db.QueryRow(
		`SELECT EXISTS (SELECT 1 FROM panel_databases WHERE lower(engine) = lower($1) AND lower(name) = lower($2))`,
		engine,
		name,
	).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}

	host := "127.0.0.1"
	port := databaseEnginePort(engine)
	if port == "" {
		return errors.New("database engine is not supported")
	}

	_, err := s.db.Exec(
		`INSERT INTO panel_databases (owner_email, domain, engine, name, username, connection_uri, host, port, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
		normalizeEmail(ownerEmail),
		normalizeDomain(domain),
		strings.ToLower(strings.TrimSpace(engine)),
		normalizeDatabaseIdentifier(name),
		normalizeDatabaseIdentifier(username),
		connectionURI,
		host,
		port,
	)
	return err
}

func (s *server) loadSubdomainItem(fullDomain string) (subdomainItem, error) {
	var item subdomainItem
	var createdAt time.Time
	var updatedAt time.Time
	var provisionedAt time.Time

	err := s.db.QueryRow(
		`SELECT owner_email, domain, subdomain, full_domain, project_name, app_type, public_path, database_name, database_username, connection_uri, created_at, updated_at, provisioned_at
		 FROM panel_subdomains
		 WHERE lower(full_domain) = lower($1)`,
		normalizeDomain(fullDomain),
	).Scan(&item.OwnerEmail, &item.Domain, &item.Subdomain, &item.FullDomain, &item.ProjectName, &item.AppType, &item.PublicPath, &item.DatabaseName, &item.DatabaseUsername, &item.ConnectionURI, &createdAt, &updatedAt, &provisionedAt)
	if err != nil {
		return subdomainItem{}, err
	}

	item.CreatedAt = createdAt.Format(time.RFC3339)
	item.UpdatedAt = updatedAt.Format(time.RFC3339)
	item.ProvisionedAt = provisionedAt.Format(time.RFC3339)
	if ready, err := s.authoritativeSubdomainDNSReady(item.Domain, item.FullDomain); err == nil && ready {
		item.DNSStatus = "ready"
	} else {
		item.DNSStatus = "pending"
	}
	if live, err := s.domainSiteLive(item.FullDomain); err == nil && live {
		item.SiteStatus = "live"
	} else {
		item.SiteStatus = "offline"
	}

	return item, nil
}

func (s *server) cleanupSubdomain(domain, subdomain, publicPath, fullDomain, dbName, dbUser, appType string) error {
	domain = normalizeDomain(domain)
	subdomain = normalizeSubdomainLabel(subdomain)
	fullDomain = normalizeDomain(fullDomain)
	appType = strings.ToLower(strings.TrimSpace(appType))

	_ = exec.Command("pdnsutil", "delete-rrset", domain, subdomain, "A").Run()
	_ = exec.Command("pdnsutil", "delete-rrset", domain, fullDomain, "A").Run()
	_ = exec.Command("pdnsutil", "delete-rrset", domain, "www."+subdomain, "A").Run()
	_ = exec.Command("pdnsutil", "delete-rrset", domain, "www."+fullDomain, "A").Run()
	_ = exec.Command("pdnsutil", "rectify-zone", domain).Run()
	_ = exec.Command("pdns_control", "rediscover").Run()

	availablePath := filepath.Join("/etc/nginx/sites-available", fullDomain+".conf")
	enabledPath := filepath.Join("/etc/nginx/sites-enabled", fullDomain+".conf")
	_ = os.Remove(availablePath)
	_ = os.Remove(enabledPath)

	if err := os.RemoveAll(filepath.Join(s.sitesRoot, domain, "subdomains", subdomain)); err != nil {
		return fmt.Errorf("failed to delete subdomain webroot: %w", err)
	}

	if dbName != "" && dbUser != "" && appType != "plain" {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		_, _ = s.db.Exec(`DELETE FROM panel_databases WHERE lower(engine) = 'mariadb' AND lower(name) = lower($1)`, normalizeDatabaseIdentifier(dbName))
		_ = os.RemoveAll(filepath.Join(s.sitesRoot, domain, "subdomains", subdomain))
	}

	if output, err := exec.Command("nginx", "-t").CombinedOutput(); err == nil {
		_ = output
		_ = exec.Command("systemctl", "reload", "nginx").Run()
	}

	return nil
}

func trimIdentifier(value string, maxLen int) string {
	value = normalizeDatabaseIdentifier(value)
	if len(value) > maxLen {
		value = value[:maxLen]
	}
	value = strings.Trim(value, "_")
	if value == "" {
		value = "app"
	}
	return value
}

func (s *server) makeAppDatabaseMeta(domain, subdomain, appType string) (dbName, dbUser, dbPass, connectionURI string) {
	base := trimIdentifier("app_"+subdomain, 28)
	suffix := strings.ToLower(strings.TrimSpace(strings.ReplaceAll(domain, ".", "_")))
	if len(suffix) > 8 {
		suffix = suffix[:8]
	}
	if suffix == "" {
		suffix = "site"
	}
	dbName = trimIdentifier(strings.Join([]string{base, suffix}, "_"), 63)
	dbUser = trimIdentifier(strings.Join([]string{base, "u", suffix}, "_"), 63)
	pass := strings.TrimSpace(randomHexOrFallback(8))
	if pass == "" {
		pass = "App-ChangeMe123!"
	}
	dbPass = pass
	connectionURI = databaseConnectionURI("mariadb", "127.0.0.1", databaseEnginePort("mariadb"), dbName, dbUser, dbPass)
	return
}

func randomHexOrFallback(length int) string {
	token, err := randomToken(length)
	if err != nil {
		return ""
	}
	return token
}

func (s *server) subdomainDatabaseMeta(domain, subdomain, appType string) (string, string, string) {
	appType = strings.ToLower(strings.TrimSpace(appType))
	if appType == "plain" || appType == "" {
		return "", "", ""
	}
	dbName, dbUser, dbPass, _ := s.makeAppDatabaseMeta(domain, subdomain, appType)
	return dbName, dbUser, dbPass
}

func (s *server) provisionSubdomain(domain, subdomain, projectName, appType, ownerEmail, publicPath, fullDomain, dbName, dbUser, dbPass string) (subdomainProvisionResult, error) {
	result := subdomainProvisionResult{}
	domain = normalizeDomain(domain)
	subdomain = normalizeSubdomainLabel(subdomain)
	fullDomain = normalizeDomain(fullDomain)
	appType = strings.ToLower(strings.TrimSpace(appType))

	if err := os.MkdirAll(publicPath, 0755); err != nil {
		return result, fmt.Errorf("failed to create subdomain public folder: %w", err)
	}

	switch appType {
	case "", "plain":
		indexPath := filepath.Join(publicPath, "index.html")
		title := fullDomain
		if projectName != "" {
			title = projectName
		}
		indexHTML := fmt.Sprintf(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>%s</title>
    <style>body{font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;display:grid;place-items:center;min-height:100vh;padding:24px}.card{width:min(680px,100%%);background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 24px 60px rgba(15,23,42,.08)}code{display:block;margin-top:16px;padding:14px 16px;background:#f8fafc;border-radius:16px;word-break:break-all}</style>
  </head>
  <body>
    <div class="card">
      <h1>%s</h1>
      <p>Subdomain ready through the Diworkin hosting panel.</p>
      <code>%s</code>
    </div>
  </body>
</html>`, html.EscapeString(title), html.EscapeString(title), html.EscapeString(publicPath))
		if err := os.WriteFile(indexPath, []byte(indexHTML), 0644); err != nil {
			return result, fmt.Errorf("failed to write subdomain index: %w", err)
		}
	case "wordpress":
		wpResult, err := s.installWordPress(publicPath, fullDomain, projectName, domain, subdomain, ownerEmail, dbName, dbUser, dbPass)
		if err != nil {
			return result, err
		}
		result = wpResult
	case "codeigniter":
		if err := s.installCodeIgniter(publicPath, fullDomain, projectName, domain, subdomain, dbName, dbUser, dbPass); err != nil {
			return result, err
		}
	case "laravel":
		if err := s.installLaravel(publicPath, fullDomain, projectName, domain, subdomain, dbName, dbUser, dbPass); err != nil {
			return result, err
		}
	default:
		return result, errors.New("app_type must be plain, wordpress, codeigniter, or laravel")
	}

	serverIP := s.serverIP()
	if serverIP == "" {
		return result, errors.New("server public IP is not available yet")
	}

	if err := s.addDNSRRSet(domain, subdomain, "A", 3600, serverIP, 0); err != nil {
		return result, err
	}
	if err := s.addDNSRRSet(domain, "www."+subdomain, "A", 3600, serverIP, 0); err != nil {
		// non-fatal for subdomain hosts, keep site running
		log.Printf("add www record for %s failed: %v", fullDomain, err)
	}

	if err := writeHostNginxConfig(fullDomain, subdomainWebRoot(publicPath, appType), false); err != nil {
		return result, fmt.Errorf("failed to write subdomain nginx config: %w", err)
	}

	return result, nil
}

func (s *server) installWordPress(publicPath, fullDomain, projectName, domain, subdomain, ownerEmail, dbName, dbUser, dbPass string) (subdomainProvisionResult, error) {
	result := subdomainProvisionResult{}
	if err := s.provisionDatabase("mariadb", dbName, dbUser, dbPass); err != nil {
		return result, err
	}

	sourcesDir := filepath.Join(s.sitesRoot, normalizeDomain(domain), "subdomains", normalizeSubdomainLabel(subdomain), "src")
	if err := os.MkdirAll(sourcesDir, 0755); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, err
	}
	tarball := filepath.Join(sourcesDir, "wordpress.tar.gz")
	if output, err := exec.Command("curl", "-fsSL", "https://wordpress.org/latest.tar.gz", "-o", tarball).CombinedOutput(); err != nil {
		_ = output
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, fmt.Errorf("failed to download wordpress: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("tar", "-xzf", tarball, "-C", publicPath, "--strip-components=1").CombinedOutput(); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, fmt.Errorf("failed to extract WordPress: %s", strings.TrimSpace(string(output)))
	}

	configPath := filepath.Join(publicPath, "wp-config.php")
config := fmt.Sprintf(`<?php
define('DB_NAME', '%s');
define('DB_USER', '%s');
define('DB_PASSWORD', '%s');
define('DB_HOST', '127.0.0.1');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');
$table_prefix = 'wp_';
define('WP_DEBUG', false);
define('FS_METHOD', 'direct');
define('FS_CHMOD_DIR', 02775);
define('FS_CHMOD_FILE', 0664);
if ( ! defined('ABSPATH') ) {
	define('ABSPATH', __DIR__ . '/');
}
require_once ABSPATH . 'wp-settings.php';
`, dbName, dbUser, dbPass)
	if err := os.WriteFile(configPath, []byte(config), 0644); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, fmt.Errorf("failed to write wp-config: %w", err)
	}
	if err := s.repairWordPressInstallation(publicPath); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, err
	}

	wpCLI, err := ensureWpCLI()
	if err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, err
	}

	adminUser := trimIdentifier("wp_"+subdomain, 24)
	if adminUser == "" {
		adminUser = "wpadmin"
	}
	adminPass := randomHexOrFallback(18)
	if adminPass == "" {
		adminPass = "Wp-ChangeMe123!"
	}

	title := strings.TrimSpace(projectName)
	if title == "" {
		title = fullDomain
	}
	wpArgs := []string{
		"--allow-root",
		"--path=" + publicPath,
		"core",
		"install",
		"--url=http://" + fullDomain,
		"--title=" + title,
		"--admin_user=" + adminUser,
		"--admin_password=" + adminPass,
		"--admin_email=" + strings.TrimSpace(ownerEmail),
		"--skip-email",
	}
	if output, err := exec.Command(wpCLI, wpArgs...).CombinedOutput(); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return result, fmt.Errorf("failed to run WordPress install: %s", strings.TrimSpace(string(output)))
	}

	result.WordPressAdminUser = adminUser
	result.WordPressAdminPass = adminPass
	_ = os.Remove(tarball)
	return result, nil
}

func (s *server) enableSubdomainHTTPS(fullDomain, ownerEmail, publicPath, appType string) error {
	if err := s.issueHostCertificate(fullDomain, ownerEmail); err != nil {
		return err
	}
	if err := writeHostNginxConfig(fullDomain, subdomainWebRoot(publicPath, appType), true); err != nil {
		return err
	}
	return s.applyWordPressHTTPS(publicPath, fullDomain)
}

func subdomainWebRoot(publicPath, appType string) string {
	publicPath = strings.TrimSpace(publicPath)
	switch strings.ToLower(strings.TrimSpace(appType)) {
	case "laravel", "codeigniter":
		return filepath.Join(publicPath, "public")
	default:
		return publicPath
	}
}

func (s *server) issueHostCertificate(fullDomain, ownerEmail string) error {
	fullDomain = normalizeDomain(fullDomain)
	ownerEmail = normalizeEmail(ownerEmail)
	if fullDomain == "" {
		return errors.New("domain is empty")
	}

	if !commandAvailable("certbot") {
		return errors.New("certbot is not available")
	}

	args := []string{
		"certonly",
		"--nginx",
		"--non-interactive",
		"--agree-tos",
		"--redirect",
		"--expand",
		"--keep-until-expiring",
		"--cert-name", fullDomain,
		"-d", fullDomain,
		"-d", "www." + fullDomain,
	}
	if ownerEmail != "" {
		args = append(args, "-m", ownerEmail)
	}

	if output, err := exec.Command("certbot", args...).CombinedOutput(); err != nil {
		return fmt.Errorf("failed to issue SSL certificate: %s", strings.TrimSpace(string(output)))
	}

	return nil
}

func writeHostNginxConfig(fullDomain, publicPath string, sslEnabled bool) error {
	fullDomain = normalizeDomain(fullDomain)
	publicPath = strings.TrimSpace(publicPath)
	if fullDomain == "" || publicPath == "" {
		return errors.New("domain or public path is empty")
	}

	var conf strings.Builder
	conf.WriteString(fmt.Sprintf(`server {
    listen 80;
    listen [::]:80;
    server_name %s www.%s;
`, fullDomain, fullDomain))
	if sslEnabled {
		conf.WriteString(`
    return 301 https://$host$request_uri;
`)
	} else {
		conf.WriteString(fmt.Sprintf(`
    root %s;
    index index.php index.html index.htm;

    access_log /var/log/nginx/%s.access.log;
    error_log /var/log/nginx/%s.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
`, publicPath, fullDomain, fullDomain))
	}
	conf.WriteString("}\n")

	if sslEnabled {
		conf.WriteString(fmt.Sprintf(`

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name %s www.%s;

    ssl_certificate /etc/letsencrypt/live/%s/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/%s/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    root %s;
    index index.php index.html index.htm;

    access_log /var/log/nginx/%s.access.log;
    error_log /var/log/nginx/%s.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}
`, fullDomain, fullDomain, fullDomain, fullDomain, publicPath, fullDomain, fullDomain))
	}

	availablePath := filepath.Join("/etc/nginx/sites-available", fullDomain+".conf")
	enabledPath := filepath.Join("/etc/nginx/sites-enabled", fullDomain+".conf")
	if err := os.WriteFile(availablePath, []byte(conf.String()), 0644); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(enabledPath), 0755); err != nil {
		return err
	}
	_ = os.Remove(enabledPath)
	if err := os.Symlink(availablePath, enabledPath); err != nil && !os.IsExist(err) {
		return err
	}
	if output, err := exec.Command("nginx", "-t").CombinedOutput(); err != nil {
		return fmt.Errorf("invalid nginx configuration: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("systemctl", "reload", "nginx").CombinedOutput(); err != nil {
		return fmt.Errorf("failed to reload nginx: %s", strings.TrimSpace(string(output)))
	}
	return nil
}

func (s *server) applyWordPressHTTPS(publicPath, fullDomain string) error {
	publicPath = strings.TrimSpace(publicPath)
	fullDomain = normalizeDomain(fullDomain)
	if publicPath == "" || fullDomain == "" {
		return nil
	}

	wpConfigPath := filepath.Join(publicPath, "wp-config.php")
	if _, err := os.Stat(wpConfigPath); err != nil {
		return nil
	}

	wpCLI, err := ensureWpCLI()
	if err != nil {
		return err
	}

	for _, option := range []string{"home", "siteurl"} {
		cmd := exec.Command(wpCLI, "--allow-root", "--path="+publicPath, "option", "update", option, "https://"+fullDomain)
		if output, err := cmd.CombinedOutput(); err != nil {
			return fmt.Errorf("failed to convert %s WordPress to HTTPS: %s", option, strings.TrimSpace(string(output)))
		}
	}

	return nil
}

func sslCertificateInfo(fullDomain string) (string, string, string) {
	fullDomain = normalizeDomain(fullDomain)
	if fullDomain == "" {
		return "missing", "", ""
	}

	certPath := filepath.Join("/etc/letsencrypt/live", fullDomain, "fullchain.pem")
	data, err := os.ReadFile(certPath)
	if err != nil {
		if os.IsNotExist(err) {
			return "missing", certPath, ""
		}
		return "error", certPath, ""
	}

	block, _ := pem.Decode(data)
	if block == nil {
		return "unknown", certPath, ""
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "unknown", certPath, ""
	}

	status := "valid"
	if time.Until(cert.NotAfter) < 30*24*time.Hour {
		status = "expiring"
	}

	return status, certPath, cert.NotAfter.Format(time.RFC3339)
}

func (s *server) installCodeIgniter(publicPath, fullDomain, projectName, domain, subdomain, dbName, dbUser, dbPass string) error {
	if err := s.provisionDatabase("mariadb", dbName, dbUser, dbPass); err != nil {
		return err
	}

	composerPath, err := ensureComposer()
	if err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return err
	}

	tempDir := filepath.Join(os.TempDir(), "diworkin-codeigniter-"+strings.ReplaceAll(fullDomain, ".", "-"))
	_ = os.RemoveAll(tempDir)
	if output, err := exec.Command(composerPath, "create-project", "codeigniter4/appstarter", tempDir, "--no-interaction").CombinedOutput(); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return fmt.Errorf("failed to prepare CodeIgniter: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("sh", "-c", fmt.Sprintf("cp -a %s/. %s/", shellQuote(tempDir), shellQuote(publicPath))).CombinedOutput(); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return fmt.Errorf("failed to copy CodeIgniter: %s", strings.TrimSpace(string(output)))
	}

	envPath := filepath.Join(publicPath, ".env")
	encryptionKey := randomHexOrFallback(32)
	if encryptionKey == "" {
		encryptionKey = randomHexOrFallback(16)
	}
	envContent := fmt.Sprintf("CI_ENVIRONMENT = production\napp.baseURL = 'https://%s/'\ndatabase.default.hostname = 127.0.0.1\ndatabase.default.database = %s\ndatabase.default.username = %s\ndatabase.default.password = %s\ndatabase.default.DBDriver = MySQLi\nencryption.key = hex2bin:%s\n", fullDomain, dbName, dbUser, dbPass, encryptionKey)
	if err := os.WriteFile(envPath, []byte(envContent), 0644); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return fmt.Errorf("failed to write env CodeIgniter: %w", err)
	}
	if err := prepareCodeIgniterPaths(publicPath); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return err
	}
	return nil
}

func prepareCodeIgniterPaths(publicPath string) error {
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return errors.New("public path kosong")
	}

	targets := []string{
		filepath.Join(publicPath, "writable", "cache"),
		filepath.Join(publicPath, "writable", "logs"),
		filepath.Join(publicPath, "writable", "session"),
		filepath.Join(publicPath, "writable", "uploads"),
	}
	for _, target := range targets {
		if err := os.MkdirAll(target, 0775); err != nil {
			return fmt.Errorf("failed to prepare CodeIgniter writable path: %w", err)
		}
		if output, err := exec.Command("chown", "-R", "www-data:www-data", target).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to set CodeIgniter permissions: %s", strings.TrimSpace(string(output)))
		}
	}

	return nil
}

func (s *server) installLaravel(publicPath, fullDomain, projectName, domain, subdomain, dbName, dbUser, dbPass string) error {
	if err := s.provisionDatabase("mariadb", dbName, dbUser, dbPass); err != nil {
		return err
	}

	composerPath, err := ensureComposer()
	if err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return err
	}

	tempDir := filepath.Join(os.TempDir(), "diworkin-laravel-"+strings.ReplaceAll(fullDomain, ".", "-"))
	_ = os.RemoveAll(tempDir)
	if output, err := exec.Command(composerPath, "create-project", "laravel/laravel", tempDir, "--no-interaction").CombinedOutput(); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return fmt.Errorf("failed to prepare Laravel: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("sh", "-c", fmt.Sprintf("cp -a %s/. %s/", shellQuote(tempDir), shellQuote(publicPath))).CombinedOutput(); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return fmt.Errorf("failed to copy Laravel: %s", strings.TrimSpace(string(output)))
	}

	envPath := filepath.Join(publicPath, ".env")
	envContent := fmt.Sprintf("APP_NAME=%s\nAPP_ENV=production\nAPP_DEBUG=false\nAPP_KEY=\nAPP_URL=https://%s\nDB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=%s\nDB_USERNAME=%s\nDB_PASSWORD=%s\n", projectName, fullDomain, dbName, dbUser, dbPass)
	if err := os.WriteFile(envPath, []byte(envContent), 0644); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return fmt.Errorf("failed to write env Laravel: %w", err)
	}
	if err := prepareLaravelPaths(publicPath); err != nil {
		_ = s.removeProvisionedDatabase("mariadb", dbName, dbUser)
		return err
	}
	if strings.TrimSpace(projectName) != "" {
		appName := strings.ReplaceAll(strings.TrimSpace(projectName), `"`, `\"`)
		if err := overwriteEnvValue(envPath, "APP_NAME", fmt.Sprintf(`"%s"`, appName)); err != nil {
			log.Printf("laravel env app name warning for %s: %v", fullDomain, err)
		}
	}
	cmd := exec.Command("php", "artisan", "key:generate", "--force")
	cmd.Dir = publicPath
	if output, err := cmd.CombinedOutput(); err != nil {
		log.Printf("laravel key generate warning for %s: %s", fullDomain, strings.TrimSpace(string(output)))
	}
	migrateCmd := exec.Command("php", "artisan", "migrate", "--force")
	migrateCmd.Dir = publicPath
	if output, err := migrateCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to run Laravel migration: %s", strings.TrimSpace(string(output)))
	}
	return nil
}

func prepareLaravelPaths(publicPath string) error {
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return errors.New("public path kosong")
	}

	targets := []string{
		filepath.Join(publicPath, "storage"),
		filepath.Join(publicPath, "storage", "logs"),
		filepath.Join(publicPath, "storage", "app", "public"),
		filepath.Join(publicPath, "bootstrap", "cache"),
	}
	for _, target := range targets {
		if err := os.MkdirAll(target, 0775); err != nil {
			return fmt.Errorf("failed to prepare Laravel path: %w", err)
		}
		if output, err := exec.Command("chown", "-R", "www-data:www-data", target).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to set Laravel permissions: %s", strings.TrimSpace(string(output)))
		}
	}

	linkPath := filepath.Join(publicPath, "public", "storage")
	targetPath := filepath.Join(publicPath, "storage", "app", "public")
	_ = os.Remove(linkPath)
	if err := os.Symlink(targetPath, linkPath); err != nil && !os.IsExist(err) {
		return fmt.Errorf("failed to create storage symlink Laravel: %w", err)
	}

	return nil
}

func prepareWordPressPaths(publicPath string) error {
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return errors.New("public path kosong")
	}

	targets := []string{
		filepath.Join(publicPath, "wp-content"),
		filepath.Join(publicPath, "wp-content", "plugins"),
		filepath.Join(publicPath, "wp-content", "themes"),
		filepath.Join(publicPath, "wp-content", "uploads"),
		filepath.Join(publicPath, "wp-content", "upgrade"),
	}
	for _, target := range targets {
		if err := os.MkdirAll(target, 0775); err != nil {
			return fmt.Errorf("failed to prepare WordPress path: %w", err)
		}
		if output, err := exec.Command("chown", "-R", "www-data:www-data", target).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to set WordPress permissions: %s", strings.TrimSpace(string(output)))
		}
	}

	if output, err := exec.Command("chmod", "-R", "u+rwX,g+rwX,o+rX", filepath.Join(publicPath, "wp-content")).CombinedOutput(); err != nil {
		return fmt.Errorf("failed to adjust WordPress permissions: %s", strings.TrimSpace(string(output)))
	}
	return nil
}

func ensureWordPressDirectConfig(publicPath string) error {
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return errors.New("public path kosong")
	}

	configPath := filepath.Join(publicPath, "wp-config.php")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("failed to read wp-config: %w", err)
	}
	content := string(data)
	if strings.Contains(content, "define('FS_METHOD', 'direct');") {
		return nil
	}

	injection := "define('WP_DEBUG', false);\ndefine('FS_METHOD', 'direct');\ndefine('FS_CHMOD_DIR', 02775);\ndefine('FS_CHMOD_FILE', 0664);"
	if strings.Contains(content, "define('WP_DEBUG', false);") {
		content = strings.Replace(content, "define('WP_DEBUG', false);", injection, 1)
	} else if strings.Contains(content, "require_once ABSPATH . 'wp-settings.php';") {
		content = strings.Replace(content, "require_once ABSPATH . 'wp-settings.php';", injection+"\nrequire_once ABSPATH . 'wp-settings.php';", 1)
	} else {
		content += "\n" + injection + "\n"
	}

	if err := os.WriteFile(configPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to update wp-config: %w", err)
	}
	return nil
}

func (s *server) repairWordPressInstallation(publicPath string) error {
	if err := prepareWordPressPaths(publicPath); err != nil {
		return err
	}
	if err := ensureWordPressDirectConfig(publicPath); err != nil {
		return err
	}
	return nil
}

func (s *server) wordpressFilesystemMode(publicPath string) string {
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return ""
	}

	configPath := filepath.Join(publicPath, "wp-config.php")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return "missing"
	}
	if !strings.Contains(string(data), "define('FS_METHOD', 'direct');") {
		return "ftp"
	}

	wpContent := filepath.Join(publicPath, "wp-content")
	info, err := os.Stat(wpContent)
	if err != nil {
		return "missing"
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return "unknown"
	}
	wwwUser, err := user.Lookup("www-data")
	if err != nil {
		return "unknown"
	}
	wwwGroup, err := user.LookupGroup("www-data")
	if err != nil {
		return "unknown"
	}
	uid, err := strconv.Atoi(wwwUser.Uid)
	if err != nil {
		return "unknown"
	}
	gid, err := strconv.Atoi(wwwGroup.Gid)
	if err != nil {
		return "unknown"
	}
	if int(stat.Uid) == uid && int(stat.Gid) == gid {
		return "direct"
	}
	return "needs_repair"
}

func overwriteEnvValue(path, key, value string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	lines := strings.Split(string(data), "\n")
	replaced := false
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		if strings.HasPrefix(trimmed, key+"=") {
			lines[i] = key + "=" + value
			replaced = true
			break
		}
	}
	if !replaced {
		lines = append([]string{key + "=" + value}, lines...)
	}

	content := strings.Join(lines, "\n")
	return os.WriteFile(path, []byte(content), 0644)
}

func ensureComposer() (string, error) {
	if commandAvailable("composer") {
		return "composer", nil
	}

	installer := filepath.Join(os.TempDir(), "composer-setup.php")
	if output, err := exec.Command("php", "-r", "copy('https://getcomposer.org/installer', '"+installer+"');").CombinedOutput(); err != nil {
		return "", fmt.Errorf("failed to download composer installer: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("php", installer, "--install-dir=/usr/local/bin", "--filename=composer").CombinedOutput(); err != nil {
		return "", fmt.Errorf("failed to install composer: %s", strings.TrimSpace(string(output)))
	}
	_ = os.Remove(installer)
	return "composer", nil
}

func ensureWpCLI() (string, error) {
	if commandAvailable("wp") {
		return "wp", nil
	}

	target := "/usr/local/bin/wp"
	if output, err := exec.Command("curl", "-fsSL", "https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar", "-o", target).CombinedOutput(); err != nil {
		_ = output
		return "", fmt.Errorf("failed to download wp-cli: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("chmod", "+x", target).CombinedOutput(); err != nil {
		_ = output
		return "", fmt.Errorf("failed to enable wp-cli: %s", strings.TrimSpace(string(output)))
	}
	return "wp", nil
}

func shellQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}

func (s *server) deleteDomain(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodDelete && r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDomainDeleteRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	domain := normalizeDomain(req.Domain)
	if domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	var ownerEmail string
	var publicPath string
	err = s.db.QueryRow(
		`SELECT owner_email, public_path FROM panel_domains WHERE lower(domain) = lower($1)`,
		domain,
	).Scan(&ownerEmail, &publicPath)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "domain not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read domain")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if err := s.cleanupDomain(domain, publicPath); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_domains WHERE lower(domain) = lower($1)`, domain); err != nil {
		writeError(w, http.StatusInternalServerError, "domain cleaned up, but failed to delete data")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Domain and related resources have been deleted.",
	})
}

func (s *server) subdomains(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listSubdomains(w, r, sess)
	case http.MethodPost:
		s.addSubdomain(w, r, sess)
	case http.MethodPatch:
		s.updateSubdomain(w, r, sess)
	case http.MethodDelete:
		s.deleteSubdomain(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) sites(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodPost:
		s.addSite(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) wordpressPassword(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeWordPressPasswordRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	targetKind := strings.ToLower(strings.TrimSpace(req.TargetKind))
	if targetKind == "" {
		targetKind = "subdomain"
	}
	if strings.ToLower(strings.TrimSpace(req.AppType)) != "wordpress" {
		writeError(w, http.StatusBadRequest, "app_type must be wordpress")
		return
	}
	if strings.TrimSpace(req.Password) == "" {
		writeError(w, http.StatusBadRequest, "WordPress password is required")
		return
	}

	switch targetKind {
	case "domain":
		if req.Domain == "" {
			writeError(w, http.StatusBadRequest, "domain is required")
			return
		}
		allowed, err := s.canManagePanelDomain(user, req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		var publicPath, appType, adminUser string
		if err := s.db.QueryRow(
			`SELECT public_path, app_type, wordpress_admin_user FROM panel_domains WHERE lower(domain) = lower($1)`,
			normalizeDomain(req.Domain),
		).Scan(&publicPath, &appType, &adminUser); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "domain has not been provisioned")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to read domain")
			return
		}
		if strings.ToLower(strings.TrimSpace(appType)) != "wordpress" {
			writeError(w, http.StatusBadRequest, "site ini bukan WordPress")
			return
		}
		if strings.TrimSpace(adminUser) == "" {
			adminUser = "wp"
		}
		if err := s.repairWordPressInstallation(publicPath); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		actualUser, err := s.updateWordPressAdminPassword(publicPath, adminUser, req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if err := s.saveWordPressAccess("domain", req.Domain, "", actualUser, req.Password); err != nil {
			log.Printf("wordpress access cache warning for %s: %v", req.Domain, err)
		}
	case "subdomain":
		if req.Domain == "" || req.Subdomain == "" {
			writeError(w, http.StatusBadRequest, "domain and subdomain are required")
			return
		}
		allowed, err := s.canManagePanelDomain(user, req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		var publicPath, appType, adminUser string
		if err := s.db.QueryRow(
			`SELECT public_path, app_type, wordpress_admin_user FROM panel_subdomains
			 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
			normalizeDomain(req.Domain),
			normalizeSubdomainLabel(req.Subdomain),
		).Scan(&publicPath, &appType, &adminUser); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "subdomain has not been provisioned")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to read subdomain")
			return
		}
		if strings.ToLower(strings.TrimSpace(appType)) != "wordpress" {
			writeError(w, http.StatusBadRequest, "site ini bukan WordPress")
			return
		}
		if strings.TrimSpace(adminUser) == "" {
			adminUser = trimIdentifier("wp_"+req.Subdomain, 24)
		}
		if err := s.repairWordPressInstallation(publicPath); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		actualUser, err := s.updateWordPressAdminPassword(publicPath, adminUser, req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if err := s.saveWordPressAccess("subdomain", req.Domain, req.Subdomain, actualUser, req.Password); err != nil {
			log.Printf("wordpress access cache warning for %s.%s: %v", req.Subdomain, req.Domain, err)
		}
	default:
		writeError(w, http.StatusBadRequest, "target_kind must be domain or subdomain")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "updated",
		"message": "WordPress password updated successfully.",
	})
}

func (s *server) wordpressRepair(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeWordPressPasswordRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	targetKind := strings.ToLower(strings.TrimSpace(req.TargetKind))
	if targetKind == "" {
		targetKind = "subdomain"
	}
	if strings.ToLower(strings.TrimSpace(req.AppType)) != "wordpress" {
		writeError(w, http.StatusBadRequest, "app_type must be wordpress")
		return
	}

	switch targetKind {
	case "domain":
		if req.Domain == "" {
			writeError(w, http.StatusBadRequest, "domain is required")
			return
		}
		allowed, err := s.canManagePanelDomain(user, req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		var publicPath, appType string
		if err := s.db.QueryRow(
			`SELECT public_path, app_type FROM panel_domains WHERE lower(domain) = lower($1)`,
			normalizeDomain(req.Domain),
		).Scan(&publicPath, &appType); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "domain has not been provisioned")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to read domain")
			return
		}
		if strings.ToLower(strings.TrimSpace(appType)) != "wordpress" {
			writeError(w, http.StatusBadRequest, "site ini bukan WordPress")
			return
		}
		if err := s.repairWordPressInstallation(publicPath); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	case "subdomain":
		if req.Domain == "" || req.Subdomain == "" {
			writeError(w, http.StatusBadRequest, "domain and subdomain are required")
			return
		}
		allowed, err := s.canManagePanelDomain(user, req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		var publicPath, appType string
		if err := s.db.QueryRow(
			`SELECT public_path, app_type FROM panel_subdomains
			 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
			normalizeDomain(req.Domain),
			normalizeSubdomainLabel(req.Subdomain),
		).Scan(&publicPath, &appType); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "subdomain has not been provisioned")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to read subdomain")
			return
		}
		if strings.ToLower(strings.TrimSpace(appType)) != "wordpress" {
			writeError(w, http.StatusBadRequest, "site ini bukan WordPress")
			return
		}
		if err := s.repairWordPressInstallation(publicPath); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	default:
		writeError(w, http.StatusBadRequest, "target_kind must be domain or subdomain")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "repaired",
		"message": "WordPress permissions repaired successfully.",
	})
}

func (s *server) addSite(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeSubdomainRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	targetKind := strings.ToLower(strings.TrimSpace(req.TargetKind))
	if targetKind == "" {
		if req.Subdomain != "" {
			targetKind = "subdomain"
		} else {
			targetKind = "domain"
		}
	}

	switch targetKind {
	case "domain":
		if req.Domain == "" {
			writeError(w, http.StatusBadRequest, "domain is required")
			return
		}
		if !isValidDomainName(req.Domain) {
			writeError(w, http.StatusBadRequest, "invalid domain format")
			return
		}
		if req.Subdomain != "" {
			req.Subdomain = ""
		}
		exists, err := s.domainExists(req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !exists {
			writeError(w, http.StatusNotFound, "domain has not been provisioned")
			return
		}
		allowed, err := s.canManagePanelDomain(user, req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}

		jobID, err := s.createInstallJob("site", user.Email, req.Domain, "", req.Domain, req.AppType, len(getSiteInstallSteps("domain", req.AppType)))
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create install job")
			return
		}

		go func() {
			s.runDomainInstallJob(jobID, sess.Email, req)
		}()

		writeJSON(w, http.StatusAccepted, map[string]any{
			"status":      "queued",
			"message":     "Instalasi site dimulai.",
			"job_id":      jobID,
			"full_domain": req.Domain,
		})
	case "subdomain":
		if req.Domain == "" || req.Subdomain == "" {
			writeError(w, http.StatusBadRequest, "domain and subdomain are required")
			return
		}
		if !isValidDomainName(req.Domain) {
			writeError(w, http.StatusBadRequest, "invalid domain format")
			return
		}
		if !isValidSubdomainLabel(req.Subdomain) {
			writeError(w, http.StatusBadRequest, "invalid subdomain format")
			return
		}

		allowed, err := s.canManagePanelDomain(user, req.Domain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}

		if existing, _ := s.subdomainExists(req.Domain, req.Subdomain); existing {
			writeError(w, http.StatusConflict, "subdomain is already registered")
			return
		}

		fullDomain := makeSubdomainHost(req.Subdomain, req.Domain)
		jobID, err := s.createInstallJob("site", user.Email, req.Domain, req.Subdomain, fullDomain, req.AppType, len(getSiteInstallSteps("subdomain", req.AppType)))
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create install job")
			return
		}

		go func() {
			s.runSubdomainInstallJob(jobID, sess.Email, req)
		}()

		writeJSON(w, http.StatusAccepted, map[string]any{
			"status":      "queued",
			"message":     "Instalasi site dimulai.",
			"job_id":      jobID,
			"full_domain": fullDomain,
		})
	default:
		writeError(w, http.StatusBadRequest, "target_kind must be domain or subdomain")
	}
}

func (s *server) listSubdomains(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	parentDomain := normalizeDomain(r.URL.Query().Get("domain"))
	query := `SELECT owner_email, domain, subdomain, full_domain, project_name, app_type, public_path, wordpress_admin_user, (wordpress_admin_pass_enc <> '') AS wordpress_access_ready, database_name, database_username, connection_uri, created_at, updated_at, provisioned_at
		FROM panel_subdomains`
	args := []any{}
	if parentDomain != "" {
		allowed, err := s.canManagePanelDomain(user, parentDomain)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		query += ` WHERE lower(domain) = lower($1)`
		args = append(args, parentDomain)
	} else if !user.IsAdmin {
		query += ` WHERE lower(domain) IN (SELECT domain FROM panel_domains WHERE lower(owner_email) = lower($1))`
		args = append(args, normalizeEmail(sess.Email))
	}
	query += ` ORDER BY created_at DESC, full_domain ASC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load subdomains")
		return
	}
	defer rows.Close()

	items := make([]subdomainItem, 0)
	for rows.Next() {
		var item subdomainItem
		var createdAt, updatedAt, provisionedAt time.Time
		if err := rows.Scan(&item.OwnerEmail, &item.Domain, &item.Subdomain, &item.FullDomain, &item.ProjectName, &item.AppType, &item.PublicPath, &item.WordPressAdminUser, &item.WordPressAccessReady, &item.DatabaseName, &item.DatabaseUsername, &item.ConnectionURI, &createdAt, &updatedAt, &provisionedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read subdomains")
			return
		}

		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		item.ProvisionedAt = provisionedAt.Format(time.RFC3339)
		item.DNSStatus = "pending"
		item.SiteStatus = "offline"

		if ready, err := s.authoritativeSubdomainDNSReady(item.Domain, item.FullDomain); err == nil && ready {
			item.DNSStatus = "ready"
		}
		if live, err := s.domainSiteLive(item.FullDomain); err == nil && live {
			item.SiteStatus = "live"
		}
		if strings.EqualFold(item.AppType, "wordpress") {
			item.WordPressFilesystemMode = s.wordpressFilesystemMode(item.PublicPath)
		}

		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"subdomains": items})
}

func (s *server) addSubdomain(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeSubdomainRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Domain == "" || req.Subdomain == "" {
		writeError(w, http.StatusBadRequest, "domain and subdomain are required")
		return
	}
	if !isValidDomainName(req.Domain) {
		writeError(w, http.StatusBadRequest, "invalid domain format")
		return
	}
	if !isValidSubdomainLabel(req.Subdomain) {
		writeError(w, http.StatusBadRequest, "invalid subdomain format")
		return
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if existing, _ := s.subdomainExists(req.Domain, req.Subdomain); existing {
		writeError(w, http.StatusConflict, "subdomain is already registered")
		return
	}

	fullDomain := makeSubdomainHost(req.Subdomain, req.Domain)
	jobID, err := s.createInstallJob("subdomain", user.Email, req.Domain, req.Subdomain, fullDomain, req.AppType, len(getSubdomainInstallSteps(req.AppType)))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create install job")
		return
	}

	go func() {
		s.runSubdomainInstallJob(jobID, sess.Email, req)
	}()

	writeJSON(w, http.StatusAccepted, map[string]any{
		"status":      "queued",
		"message":     "Instalasi subdomain dimulai.",
		"job_id":      jobID,
		"full_domain": fullDomain,
	})
}

func (s *server) updateSubdomain(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeSubdomainRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Domain == "" || req.Subdomain == "" {
		writeError(w, http.StatusBadRequest, "domain and subdomain are required")
		return
	}

	var ownerEmail, currentSubdomain string
	err = s.db.QueryRow(
		`SELECT owner_email, subdomain
		 FROM panel_subdomains
		 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
		normalizeDomain(req.Domain),
		normalizeSubdomainLabel(req.Subdomain),
	).Scan(&ownerEmail, &currentSubdomain)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "subdomain not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read subdomain")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	result, err := s.db.Exec(
		`UPDATE panel_subdomains
		 SET project_name = $3,
		     updated_at = NOW()
		 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
		normalizeDomain(req.Domain),
		normalizeSubdomainLabel(req.Subdomain),
		strings.TrimSpace(req.ProjectName),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update subdomain")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "subdomain not found")
		return
	}

	item, err := s.loadSubdomainItem(makeSubdomainHost(currentSubdomain, normalizeDomain(req.Domain)))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load subdomain")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "updated",
		"message":   "Subdomain updated successfully.",
		"subdomain": item,
	})
}

func (s *server) deleteSubdomain(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeSubdomainRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Domain == "" || req.Subdomain == "" {
		writeError(w, http.StatusBadRequest, "domain and subdomain are required")
		return
	}

	var ownerEmail, publicPath, appType, dbName, dbUser, fullDomain string
	err = s.db.QueryRow(
		`SELECT owner_email, public_path, app_type, database_name, database_username, full_domain
		 FROM panel_subdomains
		 WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
		normalizeDomain(req.Domain),
		normalizeSubdomainLabel(req.Subdomain),
	).Scan(&ownerEmail, &publicPath, &appType, &dbName, &dbUser, &fullDomain)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "subdomain not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read subdomain")
		return
	}
	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if err := s.cleanupSubdomain(normalizeDomain(req.Domain), normalizeSubdomainLabel(req.Subdomain), publicPath, fullDomain, dbName, dbUser, appType); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_subdomains WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`, normalizeDomain(req.Domain), normalizeSubdomainLabel(req.Subdomain)); err != nil {
		writeError(w, http.StatusInternalServerError, "subdomain cleaned up, but failed to delete data")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Subdomain and related resources have been deleted.",
	})
}

func (s *server) sslTargets(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	items := make([]sslTargetItem, 0)

	domainQuery := `SELECT owner_email, domain, project_name, app_type, public_path, wordpress_admin_user, (wordpress_admin_pass_enc <> '') AS wordpress_access_ready, created_at, updated_at, provisioned_at FROM panel_domains`
	domainArgs := []any{}
	if !user.IsAdmin {
		domainQuery += ` WHERE lower(owner_email) = lower($1)`
		domainArgs = append(domainArgs, normalizeEmail(sess.Email))
	}
	domainQuery += ` ORDER BY domain ASC`

	domainRows, err := s.db.Query(domainQuery, domainArgs...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load SSL targets")
		return
	}
	defer domainRows.Close()

	for domainRows.Next() {
		var ownerEmail, domain, projectName, appType, publicPath, wordpressAdminUser string
		var wordpressAccessReady bool
		var createdAt, updatedAt, provisionedAt time.Time
		if err := domainRows.Scan(&ownerEmail, &domain, &projectName, &appType, &publicPath, &wordpressAdminUser, &wordpressAccessReady, &createdAt, &updatedAt, &provisionedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read SSL targets")
			return
		}
		_ = wordpressAdminUser
		_ = wordpressAccessReady

		dnsStatus := "pending"
		if ready, _, err := s.domainDelegationReady(domain); err == nil && ready {
			dnsStatus = "ready"
		}
		siteStatus := "waiting_dns"
		if dnsStatus == "ready" {
			if live, err := s.domainSiteLive(domain); err == nil && live {
				siteStatus = "live"
			} else {
				siteStatus = "offline"
			}
		}

		certStatus, certPath, certExpires := sslCertificateInfo(domain)
		items = append(items, sslTargetItem{
			Kind:                "domain",
			Domain:              domain,
			FullDomain:          domain,
			ProjectName:         projectName,
			AppType:             appType,
			OwnerEmail:          ownerEmail,
			PublicPath:          publicPath,
			DNSStatus:           dnsStatus,
			SiteStatus:          siteStatus,
			CertificateStatus:   certStatus,
			CertificatePath:     certPath,
			CertificateExpiresAt: certExpires,
		})
		_ = createdAt
		_ = updatedAt
		_ = provisionedAt
	}

	subQuery := `SELECT owner_email, domain, subdomain, full_domain, project_name, app_type, public_path, created_at, updated_at, provisioned_at FROM panel_subdomains`
	subArgs := []any{}
	if !user.IsAdmin {
		subQuery += ` WHERE lower(owner_email) = lower($1)`
		subArgs = append(subArgs, normalizeEmail(sess.Email))
	}
	subQuery += ` ORDER BY full_domain ASC`

	subRows, err := s.db.Query(subQuery, subArgs...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load SSL targets")
		return
	}
	defer subRows.Close()

	for subRows.Next() {
		var ownerEmail, domain, subdomain, fullDomain, projectName, appType, publicPath string
		var createdAt, updatedAt, provisionedAt time.Time
		if err := subRows.Scan(&ownerEmail, &domain, &subdomain, &fullDomain, &projectName, &appType, &publicPath, &createdAt, &updatedAt, &provisionedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read SSL targets")
			return
		}

		dnsStatus := "pending"
		if ready, err := s.authoritativeSubdomainDNSReady(domain, fullDomain); err == nil && ready {
			dnsStatus = "ready"
		}
		siteStatus := "offline"
		if live, err := s.domainSiteLive(fullDomain); err == nil && live {
			siteStatus = "live"
		}

		certStatus, certPath, certExpires := sslCertificateInfo(fullDomain)
		items = append(items, sslTargetItem{
			Kind:                "subdomain",
			Domain:              domain,
			Subdomain:           subdomain,
			FullDomain:          fullDomain,
			ProjectName:         projectName,
			AppType:             appType,
			OwnerEmail:          ownerEmail,
			PublicPath:          publicPath,
			DNSStatus:           dnsStatus,
			SiteStatus:          siteStatus,
			CertificateStatus:   certStatus,
			CertificatePath:     certPath,
			CertificateExpiresAt: certExpires,
		})
		_ = createdAt
		_ = updatedAt
		_ = provisionedAt
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].Kind == items[j].Kind {
			return items[i].FullDomain < items[j].FullDomain
		}
		return items[i].Kind < items[j].Kind
	})

	writeJSON(w, http.StatusOK, map[string]any{"targets": items})
}

func (s *server) sslIssue(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeSSLIssueRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var ownerEmail, publicPath, domain, fullDomain, appType string
	switch strings.ToLower(strings.TrimSpace(req.Kind)) {
	case "domain":
		domain = normalizeDomain(req.Domain)
		if domain == "" {
			writeError(w, http.StatusBadRequest, "domain is required")
			return
		}
		err = s.db.QueryRow(
			`SELECT owner_email, public_path, domain FROM panel_domains WHERE lower(domain) = lower($1)`,
			domain,
		).Scan(&ownerEmail, &publicPath, &domain)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "domain not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to read domain")
			return
		}
		fullDomain = domain
	case "subdomain":
		domain = normalizeDomain(req.Domain)
		subdomain := normalizeSubdomainLabel(req.Subdomain)
		if domain == "" || subdomain == "" {
			writeError(w, http.StatusBadRequest, "domain and subdomain are required")
			return
		}
		err = s.db.QueryRow(
			`SELECT owner_email, public_path, app_type, full_domain, domain FROM panel_subdomains WHERE lower(domain) = lower($1) AND lower(subdomain) = lower($2)`,
			domain,
			subdomain,
		).Scan(&ownerEmail, &publicPath, &appType, &fullDomain, &domain)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusNotFound, "subdomain not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to read subdomain")
			return
		}
	default:
		writeError(w, http.StatusBadRequest, "kind must be domain or subdomain")
		return
	}

	if !user.IsAdmin && normalizeEmail(ownerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	switch strings.ToLower(strings.TrimSpace(req.Kind)) {
	case "domain":
		if err := s.enableDomainHTTPS(fullDomain, ownerEmail, publicPath); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	case "subdomain":
		if err := s.enableSubdomainHTTPS(fullDomain, ownerEmail, publicPath, appType); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	certStatus, certPath, certExpires := sslCertificateInfo(fullDomain)
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "issued",
		"message": "SSL certificate issued successfully.",
		"target": sslTargetItem{
			Kind:                strings.ToLower(strings.TrimSpace(req.Kind)),
			Domain:              domain,
			Subdomain:           normalizeSubdomainLabel(req.Subdomain),
			FullDomain:          fullDomain,
			ProjectName:         "",
			OwnerEmail:          ownerEmail,
			PublicPath:          publicPath,
			CertificateStatus:   certStatus,
			CertificatePath:     certPath,
			CertificateExpiresAt: certExpires,
		},
	})
}

func (s *server) subdomainJobs(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	jobID := strings.TrimSpace(r.URL.Query().Get("id"))
	if jobID == "" {
		writeError(w, http.StatusBadRequest, "job ID is required")
		return
	}

	item, err := s.loadInstallJob(jobID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "job not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load job")
		return
	}

	if !user.IsAdmin && normalizeEmail(item.OwnerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"job": item})
}

func (s *server) cancelSubdomainJob(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodPost && r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	jobID := strings.TrimSpace(r.URL.Query().Get("id"))
	if jobID == "" && r.Method == http.MethodPost {
		var payload struct {
			ID string `json:"id"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&payload); err == nil {
			jobID = strings.TrimSpace(payload.ID)
		}
	}
	if jobID == "" {
		writeError(w, http.StatusBadRequest, "job ID is required")
		return
	}

	item, err := s.loadInstallJob(jobID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "job not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load job")
		return
	}

	if !user.IsAdmin && normalizeEmail(item.OwnerEmail) != normalizeEmail(sess.Email) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if item.Status == "success" || item.Status == "error" || item.Status == "canceled" {
		writeJSON(w, http.StatusOK, map[string]any{
			"status": "noop",
			"job":    item,
		})
		return
	}

	if _, err := s.db.Exec(
		`UPDATE panel_install_jobs
		 SET status = 'canceled',
		     message = 'The installer was canceled by the user',
		     error_message = '',
		     completed_at = NOW(),
		     updated_at = NOW()
		 WHERE id = $1`,
		jobID,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to cancel job")
		return
	}

	updated, err := s.loadInstallJob(jobID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "job was canceled but failed to load status")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status": "canceled",
		"job":    updated,
	})
}

func (s *server) createInstallJob(kind string, ownerEmail string, domain string, subdomain string, fullDomain string, appType string, stepTotal int) (string, error) {
	jobID, err := randomToken(12)
	if err != nil {
		return "", err
	}

	_, err = s.db.Exec(
		`INSERT INTO panel_install_jobs (id, kind, status, step_index, step_total, step_label, message, domain, subdomain, full_domain, app_type, owner_email)
		 VALUES ($1, $2, 'queued', 0, $3, '', '', $4, $5, $6, $7, $8)`,
		jobID,
		kind,
		stepTotal,
		normalizeDomain(domain),
		normalizeSubdomainLabel(subdomain),
		normalizeDomain(fullDomain),
		strings.ToLower(strings.TrimSpace(appType)),
		normalizeEmail(ownerEmail),
	)
	if err != nil {
		return "", err
	}

	return jobID, nil
}

func (s *server) loadInstallJob(jobID string) (installJobItem, error) {
	var item installJobItem
	var createdAt, updatedAt, completedAt sql.NullTime
	var errorMessage sql.NullString
	err := s.db.QueryRow(
		`SELECT id, kind, status, step_index, step_total, step_label, message, domain, subdomain, full_domain, app_type, owner_email, error_message, created_at, updated_at, completed_at
		 FROM panel_install_jobs
		 WHERE id = $1`,
		strings.TrimSpace(jobID),
	).Scan(&item.ID, &item.Kind, &item.Status, &item.StepIndex, &item.StepTotal, &item.StepLabel, &item.Message, &item.Domain, &item.Subdomain, &item.FullDomain, &item.AppType, &item.OwnerEmail, &errorMessage, &createdAt, &updatedAt, &completedAt)
	if err != nil {
		return installJobItem{}, err
	}

	if errorMessage.Valid {
		item.ErrorMessage = errorMessage.String
	}
	if createdAt.Valid {
		item.CreatedAt = createdAt.Time.Format(time.RFC3339)
	}
	if updatedAt.Valid {
		item.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
	}
	if completedAt.Valid {
		item.CompletedAt = completedAt.Time.Format(time.RFC3339)
	}
	return item, nil
}

func (s *server) loadAffiliateCommissionByInvoice(invoiceNumber string) (affiliateCommissionItem, error) {
	invoiceNumber = strings.TrimSpace(invoiceNumber)
	if invoiceNumber == "" {
		return affiliateCommissionItem{}, sql.ErrNoRows
	}

	var item affiliateCommissionItem
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRow(
		`SELECT c.id, c.affiliate_id, a.owner_email, COALESCE(u.name, ''), COALESCE(u.company, ''),
		        c.source_email, c.source_invoice_number, c.amount_rupiah, c.commission_rupiah,
		        c.status, c.notes, c.created_at, c.updated_at
		   FROM panel_affiliate_commissions c
		   JOIN panel_affiliates a ON a.id = c.affiliate_id
		   JOIN panel_users u ON lower(u.email) = lower(a.owner_email)
		  WHERE lower(c.source_invoice_number) = lower($1)
		  ORDER BY c.created_at DESC, c.id DESC
		  LIMIT 1`,
		invoiceNumber,
	).Scan(
		&item.ID,
		&item.AffiliateID,
		&item.OwnerEmail,
		&item.OwnerName,
		&item.Company,
		&item.SourceEmail,
		&item.SourceInvoiceNumber,
		&item.AmountRupiah,
		&item.CommissionRupiah,
		&item.Status,
		&item.Notes,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return affiliateCommissionItem{}, err
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *server) resolveAffiliateForCustomer(email string) (affiliateItem, bool, error) {
	email = normalizeEmail(email)
	if email == "" {
		return affiliateItem{}, false, nil
	}

	var affiliateID sql.NullInt64
	var couponCode string
	err := s.db.QueryRow(
		`SELECT referrer_affiliate_id, COALESCE(affiliate_coupon_code, '')
		   FROM panel_users
		  WHERE lower(email) = lower($1)`,
		email,
	).Scan(&affiliateID, &couponCode)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return affiliateItem{}, false, nil
		}
		return affiliateItem{}, false, err
	}

	if affiliateID.Valid && affiliateID.Int64 > 0 {
		item, err := s.loadAffiliateByID(affiliateID.Int64)
		if err == nil {
			return item, true, nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return affiliateItem{}, false, err
		}
	}

	if strings.TrimSpace(couponCode) != "" {
		item, err := s.loadAffiliateByCode(couponCode)
		if err == nil {
			return item, true, nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return affiliateItem{}, false, err
		}
	}

	return affiliateItem{}, false, nil
}

func (s *server) syncAffiliateCommissionFromBilling(item billingItem) error {
	invoiceNumber := strings.TrimSpace(item.InvoiceNumber)
	if invoiceNumber == "" {
		return nil
	}

	existingCommission, err := s.loadAffiliateCommissionByInvoice(invoiceNumber)
	hasExistingCommission := err == nil
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	isBillable := strings.EqualFold(strings.TrimSpace(item.Status), "paid")
	if !isBillable && !hasExistingCommission {
		return nil
	}

	var affiliate affiliateItem
	if hasExistingCommission {
		affiliate, err = s.loadAffiliateByID(existingCommission.AffiliateID)
		if err != nil {
			return err
		}
	} else {
		var found bool
		affiliate, found, err = s.resolveAffiliateForCustomer(item.CustomerEmail)
		if err != nil {
			return err
		}
		if !found {
			return nil
		}
	}

	commissionAmount := int64(math.Round(float64(item.AmountRupiah) * float64(affiliate.CommissionPercent) / 100.0))
	now := time.Now().UTC()

	if hasExistingCommission {
		_, err = s.db.Exec(
			`UPDATE panel_affiliate_commissions
			    SET source_email = $2,
			        source_invoice_number = $3,
			        amount_rupiah = $4,
			        commission_rupiah = $5,
			        status = $6,
			        notes = $7,
			        updated_at = $8
			  WHERE id = $1`,
			existingCommission.ID,
			item.CustomerEmail,
			invoiceNumber,
			item.AmountRupiah,
			commissionAmount,
			item.Status,
			item.Notes,
			now,
		)
	} else if isBillable {
		_, err = s.db.Exec(
			`INSERT INTO panel_affiliate_commissions (
				affiliate_id, source_email, source_invoice_number, amount_rupiah, commission_rupiah,
				status, notes, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			affiliate.ID,
			item.CustomerEmail,
			invoiceNumber,
			item.AmountRupiah,
			commissionAmount,
			item.Status,
			item.Notes,
			now,
			now,
		)
	}
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		`UPDATE panel_affiliates
		    SET total_commission_rupiah = COALESCE((
		            SELECT SUM(commission_rupiah)
		              FROM panel_affiliate_commissions
		             WHERE affiliate_id = $1
		               AND lower(status) IN ('paid', 'approved')
		        ), 0),
		        updated_at = NOW()
		  WHERE id = $1`,
		affiliate.ID,
	)
	return err
}

func (s *server) updateInstallJob(jobID string, status string, stepIndex int, stepTotal int, stepLabel string, message string, errorMessage string) {
	status = strings.ToLower(strings.TrimSpace(status))
	if status == "" {
		status = "running"
	}

	if _, err := s.db.Exec(
		`UPDATE panel_install_jobs
		 SET status = $2,
		     step_index = $3,
		     step_total = $4,
		     step_label = $5,
		     message = $6,
		     error_message = $7,
		     completed_at = CASE WHEN $2 IN ('success', 'error') THEN NOW() ELSE completed_at END,
		     updated_at = NOW()
		 WHERE id = $1`,
		jobID,
		status,
		stepIndex,
		stepTotal,
		stepLabel,
		message,
		errorMessage,
	); err != nil {
		log.Printf("update install job %s failed: %v", jobID, err)
	}
}

func (s *server) installJobStatus(jobID string) (string, error) {
	var status string
	if err := s.db.QueryRow(`SELECT status FROM panel_install_jobs WHERE id = $1`, jobID).Scan(&status); err != nil {
		return "", err
	}
	return strings.ToLower(strings.TrimSpace(status)), nil
}

func (s *server) installJobCanceled(jobID string) bool {
	status, err := s.installJobStatus(jobID)
	if err != nil {
		return false
	}
	return status == "canceled"
}

func (s *server) runSubdomainInstallJob(jobID string, sessEmail string, req subdomainRequest) {
	steps := getSubdomainInstallSteps(req.AppType)
	stepTotal := len(steps)
	stepLabel := func(index int) string {
		if index < 0 || index >= len(steps) {
			return ""
		}
		return steps[index]
	}

	update := func(index int, status string, message string, errMessage string) bool {
		if status != "error" && s.installJobCanceled(jobID) {
			s.updateInstallJob(jobID, "canceled", index, stepTotal, stepLabel(index), "The installer was canceled by the user", "")
			return false
		}
		s.updateInstallJob(jobID, status, index, stepTotal, stepLabel(index), message, errMessage)
		return true
	}

	if !update(0, "running", fmt.Sprintf("Starting subdomain installation %s", makeSubdomainHost(req.Subdomain, req.Domain)), "") {
		return
	}
	if s.installJobCanceled(jobID) {
		return
	}

	fullDomain := makeSubdomainHost(req.Subdomain, req.Domain)
	publicPath := s.subdomainPublicPath(req.Domain, req.Subdomain)
	dbName, dbUser, dbPass, connectionURI := "", "", "", ""

	if req.AppType != "plain" {
		if !update(1, "running", "Preparing MariaDB database", "") {
			return
		}
		dbName, dbUser, dbPass, connectionURI = s.makeAppDatabaseMeta(req.Domain, req.Subdomain, req.AppType)
	}

	if !update(0, "running", "Checking domain and owner access", "") {
		return
	}
	if s.installJobCanceled(jobID) {
		return
	}
	owner, err := s.loadUser(sessEmail)
	if err != nil {
		update(0, "error", "Failed to load user", err.Error())
		return
	}
	allowed, err := s.canManagePanelDomain(owner, req.Domain)
	if err != nil {
		update(0, "error", "Failed to verify domain", err.Error())
		return
	}
	if !allowed {
		update(0, "error", "Domain cannot be managed", "forbidden")
		return
	}

	if existing, _ := s.subdomainExists(req.Domain, req.Subdomain); existing {
		update(0, "error", "Subdomain already exists", "subdomain is already registered")
		return
	}

	if req.AppType != "plain" {
		if !update(2, "running", "Running installer starter app", "") {
			return
		}
		if s.installJobCanceled(jobID) {
			return
		}
	}

	provisionResult, err := s.provisionSubdomain(req.Domain, req.Subdomain, req.ProjectName, req.AppType, sessEmail, publicPath, fullDomain, dbName, dbUser, dbPass)
	if err != nil {
		if s.installJobCanceled(jobID) {
			_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
			return
		}
		update(stepTotal-1, "error", "Provisioning failed", err.Error())
		_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
		return
	}

	if !update(stepTotal-2, "running", "Issue SSL and redirect to HTTPS", "") {
		_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
		return
	}
	if err := s.enableSubdomainHTTPS(fullDomain, sessEmail, publicPath, req.AppType); err != nil {
		log.Printf("subdomain https warning for %s: %v", fullDomain, err)
		update(stepTotal-2, "running", "SSL is not active yet, the site is still running over HTTP for now", err.Error())
	} else {
		update(stepTotal-2, "running", "SSL is active and the site is redirected to HTTPS", "")
	}

	if connectionURI != "" {
		if !update(stepTotal-2, "running", "Menyimpan metadata database", "") {
			_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
			return
		}
		if s.installJobCanceled(jobID) {
			_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
			return
		}
		if err := s.saveProvisionedDatabase(sessEmail, req.Domain, "mariadb", dbName, dbUser, connectionURI); err != nil {
			_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
			update(stepTotal-1, "error", "Failed to save metadata database", err.Error())
			return
		}
	}

	if err := s.saveSubdomain(req.Domain, req.Subdomain, req.ProjectName, req.AppType, sessEmail, publicPath, fullDomain, dbName, dbUser, connectionURI); err != nil {
		if s.installJobCanceled(jobID) {
			_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
			return
		}
		_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
		if isUniqueViolation(err) {
		update(stepTotal-1, "error", "Subdomain already exists", err.Error())
		return
	}
		update(stepTotal-1, "error", "Failed to save subdomain", err.Error())
		return
	}

	if s.installJobCanceled(jobID) {
		_ = s.cleanupSubdomain(req.Domain, req.Subdomain, publicPath, fullDomain, dbName, dbUser, req.AppType)
		return
	}

	if strings.ToLower(strings.TrimSpace(req.AppType)) == "wordpress" && provisionResult.WordPressAdminUser != "" {
		update(stepTotal-1, "running", fmt.Sprintf("WordPress admin ready: %s / %s", provisionResult.WordPressAdminUser, provisionResult.WordPressAdminPass), "")
	}
	if strings.ToLower(strings.TrimSpace(req.AppType)) == "wordpress" && provisionResult.WordPressAdminUser != "" && provisionResult.WordPressAdminPass != "" {
		if err := s.saveWordPressAccess("subdomain", req.Domain, req.Subdomain, provisionResult.WordPressAdminUser, provisionResult.WordPressAdminPass); err != nil {
			log.Printf("wordpress access save warning for %s.%s: %v", req.Subdomain, req.Domain, err)
		}
	}
	successMessage := "Subdomain created successfully"
	if strings.ToLower(strings.TrimSpace(req.AppType)) == "wordpress" && provisionResult.WordPressAdminUser != "" {
		successMessage = fmt.Sprintf(
			"Subdomain created successfully. WordPress admin: %s / %s",
			provisionResult.WordPressAdminUser,
			provisionResult.WordPressAdminPass,
		)
	}
	update(stepTotal-1, "success", successMessage, "")
}

func (s *server) runDomainInstallJob(jobID string, sessEmail string, req subdomainRequest) {
	steps := getSiteInstallSteps("domain", req.AppType)
	stepTotal := len(steps)
	appType := strings.ToLower(strings.TrimSpace(req.AppType))
	stepLabel := func(index int) string {
		if index < 0 || index >= len(steps) {
			return ""
		}
		return steps[index]
	}

	update := func(index int, status string, message string, errMessage string) bool {
		if status != "error" && s.installJobCanceled(jobID) {
			s.updateInstallJob(jobID, "canceled", index, stepTotal, stepLabel(index), "The installer was canceled by the user", "")
			return false
		}
		s.updateInstallJob(jobID, status, index, stepTotal, stepLabel(index), message, errMessage)
		return true
	}

	domain := normalizeDomain(req.Domain)
	if !update(0, "running", fmt.Sprintf("Starting site installation %s", domain), "") {
		return
	}
	if s.installJobCanceled(jobID) {
		return
	}

	owner, err := s.loadUser(sessEmail)
	if err != nil {
		update(0, "error", "Failed to load user", err.Error())
		return
	}
	allowed, err := s.canManagePanelDomain(owner, domain)
	if err != nil {
		update(0, "error", "Failed to verify domain", err.Error())
		return
	}
	if !allowed {
		update(0, "error", "Domain cannot be managed", "forbidden")
		return
	}

	var ownerEmail, publicPath, currentProject string
	if err := s.db.QueryRow(
		`SELECT owner_email, public_path, project_name
		 FROM panel_domains
		 WHERE lower(domain) = lower($1)`,
		domain,
	).Scan(&ownerEmail, &publicPath, &currentProject); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			update(0, "error", "Domain has not been provisioned yet", "domain has not been provisioned")
			return
		}
		update(0, "error", "Failed to read domain", err.Error())
		return
	}
	effectiveProjectName := strings.TrimSpace(req.ProjectName)
	if effectiveProjectName == "" {
		effectiveProjectName = strings.TrimSpace(currentProject)
	}

	if strings.TrimSpace(req.ProjectName) != "" && strings.TrimSpace(req.ProjectName) != currentProject {
		if _, err := s.db.Exec(
			`UPDATE panel_domains
			 SET project_name = $2, updated_at = NOW()
			 WHERE lower(domain) = lower($1)`,
			domain,
			strings.TrimSpace(req.ProjectName),
		); err != nil {
			update(0, "error", "Failed to save project name", err.Error())
			return
		}
	}

	dbName, dbUser, dbPass, connectionURI := "", "", "", ""
	folderIndex := 1
	installIndex := -1
	sslIndex := 2
	if appType != "plain" {
		if !update(1, "running", "Preparing MariaDB database", "") {
			return
		}
		dbName, dbUser, dbPass, connectionURI = s.makeAppDatabaseMeta(domain, "", appType)
		folderIndex = 2
		installIndex = 3
		sslIndex = 4
	}

	if !update(folderIndex, "running", "Preparing domain public folder", "") {
		return
	}
	if err := s.provisionDomain(domain, effectiveProjectName, ownerEmail, publicPath); err != nil {
		update(0, "error", "Failed to prepare domain", err.Error())
		return
	}

	var provisionResult subdomainProvisionResult
	if appType != "plain" {
		if !update(installIndex, "running", "Running installer starter app", "") {
			return
		}
		var installErr error
		switch appType {
		case "wordpress":
			provisionResult, installErr = s.installWordPress(publicPath, domain, req.ProjectName, domain, "", sessEmail, dbName, dbUser, dbPass)
		case "codeigniter":
			installErr = s.installCodeIgniter(publicPath, domain, req.ProjectName, domain, "", dbName, dbUser, dbPass)
		case "laravel":
			installErr = s.installLaravel(publicPath, domain, req.ProjectName, domain, "", dbName, dbUser, dbPass)
		default:
			installErr = errors.New("app_type must be plain, wordpress, codeigniter, or laravel")
		}
		if installErr != nil {
			update(stepTotal-1, "error", "Provisioning failed", installErr.Error())
			return
		}
		if connectionURI != "" {
			if err := s.saveProvisionedDatabase(sessEmail, domain, "mariadb", dbName, dbUser, connectionURI); err != nil {
				update(stepTotal-1, "error", "Failed to save metadata database", err.Error())
				return
			}
		}
	}

	if !update(sslIndex, "running", "Issue SSL and redirect to HTTPS", "") {
		return
	}
	if err := s.enableDomainHTTPS(domain, ownerEmail, publicPath); err != nil {
		log.Printf("domain https warning for %s: %v", domain, err)
		update(sslIndex, "running", "SSL is not active yet, the site is still running over HTTP for now", err.Error())
	} else {
		update(sslIndex, "running", "SSL is active and the site is redirected to HTTPS", "")
	}

	if strings.ToLower(strings.TrimSpace(appType)) == "wordpress" && provisionResult.WordPressAdminUser != "" {
		update(stepTotal-1, "running", fmt.Sprintf("WordPress admin ready: %s / %s", provisionResult.WordPressAdminUser, provisionResult.WordPressAdminPass), "")
	}
	if strings.ToLower(strings.TrimSpace(appType)) == "wordpress" && provisionResult.WordPressAdminUser != "" && provisionResult.WordPressAdminPass != "" {
		if err := s.saveWordPressAccess("domain", domain, "", provisionResult.WordPressAdminUser, provisionResult.WordPressAdminPass); err != nil {
			log.Printf("wordpress access save warning for %s: %v", domain, err)
		}
	}

	successMessage := "Site created successfully"
	if strings.ToLower(strings.TrimSpace(appType)) == "wordpress" && provisionResult.WordPressAdminUser != "" {
		successMessage = fmt.Sprintf(
			"Site created successfully. WordPress admin: %s / %s",
			provisionResult.WordPressAdminUser,
			provisionResult.WordPressAdminPass,
		)
	}
	update(stepTotal-1, "success", successMessage, "")
}

func (s *server) mailDomains(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	query := `SELECT name FROM mail_domains`
	args := []any{}
	if !user.IsAdmin {
		query = `
			SELECT DISTINCT domain_name
			FROM (
				SELECT domain AS domain_name
				FROM panel_domains
				WHERE lower(owner_email) = lower($1)
				UNION
				SELECT full_domain AS domain_name
				FROM panel_subdomains
				WHERE lower(owner_email) = lower($1)
			) AS allowed_mail_domains
		`
		args = append(args, normalizeEmail(user.Email))
	}
	query += ` ORDER BY 1 ASC`

	rows, err := s.mailDB.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load domains")
		return
	}
	defer rows.Close()

	type mailDomain struct {
		Domain      string `json:"domain"`
		DisplayName string `json:"display_name"`
		OwnerEmail  string `json:"owner_email,omitempty"`
	}

	items := make([]mailDomain, 0)
	for rows.Next() {
		var domain string
		if err := rows.Scan(&domain); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read domains")
			return
		}

		items = append(items, mailDomain{
			Domain:      domain,
			DisplayName: domain,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{"domains": items})
}

func (s *server) mailAccounts(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	switch r.Method {
	case http.MethodGet:
		s.listMailAccounts(w, r, sess)
	case http.MethodPost:
		s.createMailAccount(w, r, sess)
	case http.MethodPatch:
		s.updateMailAccount(w, r, sess)
	case http.MethodDelete:
		s.deleteMailAccount(w, r, sess)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) mailAccess(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	email := normalizeEmail(r.URL.Query().Get("email"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		writeError(w, http.StatusBadRequest, "invalid email format")
		return
	}

	allowed, err := s.canManagePanelDomain(user, parts[1])
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	account, err := s.loadMailAccountSummary(email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "mailbox not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read mailbox")
		return
	}
	if !account.Enabled {
		writeError(w, http.StatusForbidden, "mailbox is disabled")
		return
	}

	panelSessionToken, panelExpiresAt, err := s.createSession(user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to refresh panel session")
		return
	}
	s.clearSessionCookie(w)
	s.setSessionCookie(w, panelSessionToken, panelExpiresAt)

	mailSessionToken, mailExpiresAt, err := s.createMailSession(account.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create mail session")
		return
	}
	s.setMailSessionCookie(w, mailSessionToken, mailExpiresAt)

	token, err := s.issueMailSSOToken(account.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create mail access token")
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	target := s.mailBaseURL + "/api/email/open?token=" + url.QueryEscape(token)
	http.Redirect(w, r, target, http.StatusSeeOther)
}

func (s *server) emailOpen(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	mailSess, mailOK := s.currentMailSession(r)
	if mailOK {
		if _, err := s.loadMailAccountSummary(mailSess.Email); err != nil {
			writeError(w, http.StatusUnauthorized, "session is invalid")
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" && r.Method == http.MethodPost {
		var body struct {
			Token string `json:"token"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		defer r.Body.Close()
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			token = strings.TrimSpace(body.Token)
		}
	}
	if token == "" {
		writeError(w, http.StatusBadRequest, "token is required")
		return
	}

	email, err := s.verifyMailSSOToken(token)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	account, err := s.loadMailAccountSummary(email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "mailbox not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read mailbox")
		return
	}
	if !account.Enabled {
		writeError(w, http.StatusForbidden, "mailbox is disabled")
		return
	}

	sessionToken, expiresAt, err := s.createMailSession(account.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create mail session")
		return
	}
	s.setMailSessionCookie(w, sessionToken, expiresAt)

	w.Header().Set("Cache-Control", "no-store")
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (s *server) emailSSO(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" && r.Method == http.MethodPost {
		var body struct {
			Token string `json:"token"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		defer r.Body.Close()
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			token = strings.TrimSpace(body.Token)
		}
	}
	if token == "" {
		writeError(w, http.StatusBadRequest, "token is required")
		return
	}

	email, err := s.verifyMailSSOToken(token)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	account, err := s.loadMailAccountSummary(email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "mailbox not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read mailbox")
		return
	}
	if !account.Enabled {
		writeError(w, http.StatusForbidden, "mailbox is disabled")
		return
	}

	sessionToken, expiresAt, err := s.createMailSession(account.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create mail session")
		return
	}
	s.setMailSessionCookie(w, sessionToken, expiresAt)

	if r.Method == http.MethodGet {
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "authenticated",
		"account": account,
	})
}

func (s *server) emailLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := decodeMailAuthRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	account, passwordHash, err := s.lookupMailAccount(req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "email or password is incorrect")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to read mailbox")
		return
	}
	if !account.Enabled {
		writeError(w, http.StatusForbidden, "mailbox is disabled")
		return
	}

	ok, err := verifyMailPasswordHash(passwordHash, req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify password")
		return
	}
	if !ok {
		writeError(w, http.StatusUnauthorized, "email or password is incorrect")
		return
	}

	sessionToken, expiresAt, err := s.createMailSession(account.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	s.setMailSessionCookie(w, sessionToken, expiresAt)
	folders, err := s.mailFolderSummaries(account.Maildir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load mailbox")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "authenticated",
		"account": account,
		"folders": folders,
	})
}

func (s *server) emailLogout(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if _, err := s.mailDB.Exec(`DELETE FROM mail_sessions WHERE token_hash = $1`, sess.TokenHash); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to log out")
		return
	}

	s.clearMailSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) emailMe(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	account, err := s.loadMailAccountSummary(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	folders, err := s.mailFolderSummaries(account.Maildir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load mailbox")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "authenticated",
		"account": account,
		"folders": folders,
	})
}

func (s *server) emailInbox(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	account, err := s.loadMailAccountSummary(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	folder := normalizeMailFolderName(r.URL.Query().Get("folder"))
	if folder == "" {
		folder = "Inbox"
	}

	folders, err := s.mailFolderSummaries(account.Maildir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load mailbox")
		return
	}

	messages, err := s.mailFolderMessages(account.Maildir, folder, 100)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load messages")
		return
	}

	var selected *mailMessageDetail
	if len(messages) > 0 {
		detail, err := s.loadMailMessage(account.Maildir, messages[0].ID)
		if err == nil {
			selected = &detail
		}
	}

	writeJSON(w, http.StatusOK, mailInboxResponse{
		Account:  account,
		Folders:  folders,
		Messages: messages,
		Selected: selected,
	})
}

func (s *server) emailMessage(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	account, err := s.loadMailAccountSummary(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	messageID := strings.TrimSpace(r.URL.Query().Get("id"))
	if messageID == "" {
		writeError(w, http.StatusBadRequest, "message id is required")
		return
	}

	detail, err := s.loadMailMessage(account.Maildir, messageID)
	if err != nil {
		writeError(w, http.StatusNotFound, "message not found")
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

func (s *server) emailSend(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	account, err := s.loadMailAccountSummary(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeMailSendRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	toHeader := collectMailRecipients(req.To)
	ccHeader := collectMailRecipients(req.Cc)
	recipients := collectMailRecipients(req.To, req.Cc, req.Bcc)
	if len(recipients) == 0 {
		writeError(w, http.StatusBadRequest, "at least one recipient is required")
		return
	}
	if strings.TrimSpace(req.Subject) == "" {
		writeError(w, http.StatusBadRequest, "subject is required")
		return
	}

	htmlBody := strings.TrimSpace(req.HTML)
	textBody := strings.TrimSpace(req.Text)
	if htmlBody == "" && textBody == "" {
		writeError(w, http.StatusBadRequest, "message body is required")
		return
	}
	if htmlBody == "" {
		htmlBody = wrapPlainTextAsHTML(textBody)
	}
	if textBody == "" {
		textBody = stripHTMLToText(htmlBody)
	}

	if err := s.sendMailMessage(account.Email, account.Email, toHeader, ccHeader, recipients, req.Subject, htmlBody, textBody); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to send mail")
		return
	}

	if err := s.saveSentCopy(account.Maildir, account.Email, toHeader, ccHeader, req.Subject, htmlBody, textBody); err != nil {
		log.Printf("failed to save sent copy for %s: %v", account.Email, err)
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}

func (s *server) emailDraft(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	account, err := s.loadMailAccountSummary(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeMailSendRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	htmlBody := strings.TrimSpace(req.HTML)
	textBody := strings.TrimSpace(req.Text)
	if htmlBody == "" && textBody == "" {
		htmlBody = "<!doctype html><html><body></body></html>"
		textBody = ""
	}
	if htmlBody == "" {
		htmlBody = wrapPlainTextAsHTML(textBody)
	}
	if textBody == "" {
		textBody = stripHTMLToText(htmlBody)
	}

	if err := saveMailDraftCopy(account.Maildir, account.Email, collectMailRecipients(req.To), collectMailRecipients(req.Cc), req.Subject, htmlBody, textBody); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save draft")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "draft-saved"})
}

func (s *server) emailArchive(w http.ResponseWriter, r *http.Request, sess mailSessionRow) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	account, err := s.loadMailAccountSummary(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	var req mailArchiveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.ID = strings.TrimSpace(req.ID)
	req.Action = strings.ToLower(strings.TrimSpace(req.Action))
	if req.ID == "" {
		writeError(w, http.StatusBadRequest, "message id is required")
		return
	}
	if req.Action != "archive" && req.Action != "restore" {
		writeError(w, http.StatusBadRequest, "action must be archive or restore")
		return
	}

	targetFolder := "Archive"
	if req.Action == "restore" {
		targetFolder = "Inbox"
	}

	newID, err := moveMailMessage(account.Maildir, req.ID, targetFolder)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": req.Action, "id": newID})
}

func saveMailDraftCopy(maildir, fromEmail string, toHeader []string, ccHeader []string, subject, htmlBody, textBody string) error {
	draftDir := filepath.Join(maildir, ".Drafts")
	for _, dir := range []string{draftDir, filepath.Join(draftDir, "cur"), filepath.Join(draftDir, "new"), filepath.Join(draftDir, "tmp")} {
		if err := os.MkdirAll(dir, 0700); err != nil {
			return err
		}
	}

	message, err := buildMailMessage(fromEmail, formatMailRecipientList(toHeader), formatMailRecipientList(ccHeader), subject, htmlBody, textBody)
	if err != nil {
		return err
	}

	token, err := randomToken(10)
	if err != nil {
		return err
	}
	fileName := fmt.Sprintf("%d.%s.eml:2,S", time.Now().UnixNano(), token)
	filePath := filepath.Join(draftDir, "cur", fileName)
	return os.WriteFile(filePath, message, 0600)
}

func moveMailMessage(maildir, messageID, targetFolder string) (string, error) {
	relPath, err := decodeMailMessageID(messageID)
	if err != nil {
		return "", err
	}
	sourceClean, err := resolveMailMessageSource(maildir, relPath)
	if err != nil {
		return "", err
	}

	targetFolder = normalizeMailFolderName(targetFolder)
	targetBaseDir := mailFolderDirectory(maildir, targetFolder)
	if err := os.MkdirAll(filepath.Join(targetBaseDir, "cur"), 0700); err != nil {
		return "", err
	}

	baseName := filepath.Base(sourceClean)
	if targetFolder == "Archive" && !strings.Contains(baseName, ":2,") {
		baseName += ":2,S"
	}
	if targetFolder == "Inbox" && !strings.Contains(baseName, ":2,") {
		baseName += ":2,S"
	}
	targetPath := filepath.Join(targetBaseDir, "cur", baseName)
	if err := os.Remove(targetPath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return "", err
	}
	if err := os.Rename(sourceClean, targetPath); err != nil {
		return "", err
	}
	relTargetPath, err := filepath.Rel(maildir, targetPath)
	if err != nil {
		return "", err
	}
	return encodeMailMessageID(filepath.ToSlash(relTargetPath)), nil
}

func resolveMailMessageSource(maildir, relPath string) (string, error) {
	sourcePath := filepath.Join(maildir, filepath.FromSlash(relPath))
	sourceClean := filepath.Clean(sourcePath)
	maildirClean := filepath.Clean(maildir)
	if !strings.HasPrefix(sourceClean, maildirClean+string(os.PathSeparator)) && sourceClean != maildirClean {
		return "", errors.New("invalid message id")
	}
	if _, err := os.Stat(sourceClean); err == nil {
		return sourceClean, nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return "", err
	}

	baseName := filepath.Base(sourceClean)
	candidateNames := []string{baseName}
	if strings.Contains(baseName, ":2,") {
		candidateNames = append(candidateNames, strings.TrimSuffix(baseName, ":2,S"))
	} else {
		candidateNames = append(candidateNames, baseName+":2,S")
	}
	seen := map[string]struct{}{}
	folders := []string{"Inbox", "Sent", "Drafts", "Archive", "Spam", "Trash", "Starred"}
	for _, folder := range folders {
		folderDir := mailFolderDirectory(maildir, folder)
		for _, subdir := range []string{"cur", "new"} {
			for _, candidateName := range candidateNames {
				if _, ok := seen[candidateName]; ok {
					continue
				}
				seen[candidateName] = struct{}{}
				candidate := filepath.Join(folderDir, subdir, candidateName)
				if _, err := os.Stat(candidate); err == nil {
					return candidate, nil
				} else if err != nil && !errors.Is(err, os.ErrNotExist) {
					return "", err
				}
			}
		}
	}

	return "", fmt.Errorf("mail message not found: %s", relPath)
}

func (s *server) listMailAccounts(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	domainFilter := normalizeDomain(r.URL.Query().Get("domain"))
	if domainFilter != "" {
		allowed, err := s.canManagePanelDomain(user, domainFilter)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to verify domain")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	query := `SELECT email, enabled
		FROM mail_users`
	args := []any{}
	if domainFilter != "" {
		query += ` WHERE split_part(email, '@', 2) = $1`
		args = append(args, domainFilter)
	} else if !user.IsAdmin {
		query += ` WHERE split_part(email, '@', 2) IN (
			SELECT domain
			FROM panel_domains
			WHERE lower(owner_email) = lower($1)
			UNION
			SELECT full_domain
			FROM panel_subdomains
			WHERE lower(owner_email) = lower($1)
		)`
		args = append(args, normalizeEmail(sess.Email))
	}
	query += ` ORDER BY email ASC`

	rows, err := s.mailDB.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load mailbox")
		return
	}
	defer rows.Close()

	items := make([]mailAccountItem, 0)
	for rows.Next() {
		var item mailAccountItem
		if err := rows.Scan(&item.Email, &item.Enabled); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read mailbox")
			return
		}
		parts := strings.SplitN(item.Email, "@", 2)
		item.LocalPart = parts[0]
		if len(parts) == 2 {
			item.Domain = parts[1]
		}
		item.MailboxPath = filepath.Join("/var/mail/vhosts", item.Domain, item.LocalPart, "Maildir")
		item.AccessReady = item.Enabled
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"accounts": items})
}

func (s *server) createMailAccount(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeMailAccountRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" || req.LocalPart == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "domain, local part, and password are required")
		return
	}
	if !isValidDomainName(req.Domain) {
		writeError(w, http.StatusBadRequest, "invalid domain format")
		return
	}
	if !isValidMailboxLocalPart(req.LocalPart) {
		writeError(w, http.StatusBadRequest, "invalid local part")
		return
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	email := makeMailboxAddress(req.LocalPart, req.Domain)
	exists, err := s.mailAccountExists(email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check mailbox")
		return
	}
	if exists {
		writeError(w, http.StatusConflict, "mailbox is already registered")
		return
	}

	hash, err := generateMailPasswordHash(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to process password")
		return
	}

	if _, err := s.mailDB.Exec(
		`INSERT INTO mail_domains (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
		req.Domain,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to prepare mail domain")
		return
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	if _, err := s.mailDB.Exec(
		`INSERT INTO mail_users (email, password, enabled) VALUES ($1, $2, $3)`,
		email,
		hash,
		enabled,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create mailbox")
		return
	}

	if err := s.ensureMailboxStorage(email); err != nil {
		_, _ = s.mailDB.Exec(`DELETE FROM mail_users WHERE email = $1`, email)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := s.saveMailAccessSecret(email, req.Password); err != nil {
		log.Printf("mail access cache warning for %s: %v", email, err)
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"status":  "created",
		"message": "Mailbox created successfully.",
	})
}

func (s *server) updateMailAccount(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeMailAccountRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	email := normalizeEmail(req.Email)
	if email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	domain := strings.SplitN(email, "@", 2)
	if len(domain) != 2 {
		writeError(w, http.StatusBadRequest, "invalid email format")
		return
	}

	allowed, err := s.canManagePanelDomain(user, domain[1])
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if req.Password != "" {
		hash, err := generateMailPasswordHash(req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to process password")
			return
		}
		if _, err := s.mailDB.Exec(`UPDATE mail_users SET password = $2 WHERE email = $1`, email, hash); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update password")
			return
		}
		if err := s.saveMailAccessSecret(email, req.Password); err != nil {
			log.Printf("mail access cache warning for %s: %v", email, err)
		}
	}

	if req.Enabled != nil {
		if _, err := s.mailDB.Exec(`UPDATE mail_users SET enabled = $2 WHERE email = $1`, email, *req.Enabled); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update mailbox status")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "updated",
		"message": "Mailbox updated successfully.",
	})
}

func (s *server) deleteMailAccount(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeMailAccountRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	email := normalizeEmail(req.Email)
	if email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		writeError(w, http.StatusBadRequest, "invalid email format")
		return
	}

	allowed, err := s.canManagePanelDomain(user, parts[1])
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if _, err := s.mailDB.Exec(`DELETE FROM mail_users WHERE email = $1`, email); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete mailbox")
		return
	}
	s.deleteMailAccessSecret(email)
	_, _ = s.mailDB.Exec(`DELETE FROM mail_aliases WHERE source = $1 OR destination = $1`, email)
	_ = os.RemoveAll(filepath.Join("/var/mail/vhosts", parts[1], parts[0]))

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Mailbox deleted successfully.",
	})
}

func (s *server) sshAuthorizedKeysPath() string {
	return "/home/ubuntu/.ssh/authorized_keys"
}

func (s *server) sshStatus(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	if !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	active, serviceName := s.sshServiceStatus()
	port := s.sshPort()
	var keyCount int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM panel_ssh_keys`).Scan(&keyCount); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load SSH status")
		return
	}

	writeJSON(w, http.StatusOK, sshStatusResponse{
		ServiceActive:  active,
		ServiceName:    serviceName,
		Host:           s.serverIP(),
		User:           "ubuntu",
		Port:           port,
		AuthorizedKeys: s.sshAuthorizedKeysPath(),
		ManagedKeys:    keyCount,
	})
}

func (s *server) sshServiceStatus() (bool, string) {
	for _, service := range []string{"ssh", "sshd"} {
		output, err := exec.Command("systemctl", "is-active", service).CombinedOutput()
		if err != nil {
			continue
		}
		if strings.TrimSpace(string(output)) == "active" {
			return true, service
		}
	}
	return false, "ssh"
}

func (s *server) sshPort() string {
	data, err := os.ReadFile("/etc/ssh/sshd_config")
	if err != nil {
		return "22"
	}

	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) >= 2 && strings.EqualFold(fields[0], "Port") {
			if _, err := strconv.Atoi(fields[1]); err == nil {
				return fields[1]
			}
		}
	}
	return "22"
}

func (s *server) loadSSHKeys() ([]sshKeyItem, error) {
	rows, err := s.db.Query(`
		SELECT id, owner_email, title, public_key, fingerprint, enabled, created_at, updated_at
		FROM panel_ssh_keys
		ORDER BY created_at DESC, id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]sshKeyItem, 0)
	for rows.Next() {
		var item sshKeyItem
		var createdAt time.Time
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.OwnerEmail, &item.Title, &item.PublicKey, &item.Fingerprint, &item.Enabled, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *server) syncSSHAuthorizedKeys() error {
	keys, err := s.loadSSHKeys()
	if err != nil {
		return err
	}

	authorizedKeysPath := s.sshAuthorizedKeysPath()
	sshDir := filepath.Dir(authorizedKeysPath)
	ubuntuUser, err := user.Lookup("ubuntu")
	if err != nil {
		return fmt.Errorf("ubuntu user not found: %w", err)
	}
	ubuntuGroup, err := user.LookupGroup("ubuntu")
	if err != nil {
		return fmt.Errorf("ubuntu group not found: %w", err)
	}
	uid, err := strconv.Atoi(ubuntuUser.Uid)
	if err != nil {
		return err
	}
	gid, err := strconv.Atoi(ubuntuGroup.Gid)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(sshDir, 0700); err != nil {
		return err
	}
	if err := os.Chown(sshDir, uid, gid); err != nil {
		return err
	}
	const managedBegin = "# BEGIN DIWORKIN PANEL MANAGED KEYS"
	const managedEnd = "# END DIWORKIN PANEL MANAGED KEYS"
	const legacyManagedHeader = "# Managed by Diworkin Panel"

	var managed bytes.Buffer
	managed.WriteString(managedBegin + "\n")
	managedFingerprints := make(map[string]struct{})
	managedRawLines := make(map[string]struct{})
	for _, key := range keys {
		if !key.Enabled || strings.TrimSpace(key.PublicKey) == "" {
			continue
		}
		if fp, err := sshFingerprint(key.PublicKey); err == nil {
			managedFingerprints[fp] = struct{}{}
		}
		publicKey := strings.TrimSpace(key.PublicKey)
		managedRawLines[publicKey] = struct{}{}
		managed.WriteString(publicKey)
		if strings.TrimSpace(key.Title) != "" {
			managed.WriteString(" ")
			managed.WriteString("# ")
			managed.WriteString(strings.TrimSpace(key.Title))
		}
		managed.WriteString("\n")
	}

	managed.WriteString(managedEnd + "\n")

	existing, err := os.ReadFile(authorizedKeysPath)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	var buf bytes.Buffer
	lines := strings.Split(string(existing), "\n")
	skip := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == managedBegin {
			skip = true
			continue
		}
		if trimmed == managedEnd {
			skip = false
			continue
		}
		if trimmed == legacyManagedHeader {
			continue
		}
		if skip {
			continue
		}
		if line == "" && buf.Len() == 0 {
			continue
		}
		trimmedLine := strings.TrimSpace(line)
		if _, ok := managedRawLines[trimmedLine]; ok {
			continue
		}
		for managedLine := range managedRawLines {
			if strings.HasPrefix(trimmedLine, managedLine+" ") {
				trimmedLine = ""
				break
			}
		}
		if trimmedLine == "" {
			continue
		}
		if parsed, _, _, _, err := ssh.ParseAuthorizedKey([]byte(trimmed)); err == nil {
			if fp := ssh.FingerprintSHA256(parsed); fp != "" {
				if _, ok := managedFingerprints[fp]; ok {
					continue
				}
			}
		}
		buf.WriteString(line)
		buf.WriteString("\n")
	}
	if buf.Len() > 0 && !strings.HasSuffix(buf.String(), "\n") {
		buf.WriteString("\n")
	}
	if len(keys) > 0 {
		buf.Write(managed.Bytes())
	}

	if err := os.WriteFile(authorizedKeysPath, buf.Bytes(), 0600); err != nil {
		return err
	}
	if err := os.Chown(authorizedKeysPath, uid, gid); err != nil {
		return err
	}
	return nil
}

func sshFingerprint(publicKey string) (string, error) {
	parsed, _, _, _, err := ssh.ParseAuthorizedKey([]byte(strings.TrimSpace(publicKey)))
	if err != nil {
		return "", err
	}
	return ssh.FingerprintSHA256(parsed), nil
}

func (s *server) sshKeys(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	if !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	switch r.Method {
	case http.MethodGet:
		keys, err := s.loadSSHKeys()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load SSH keys")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"keys": keys,
		})
	case http.MethodPost:
		s.createSSHKey(w, r, user)
	case http.MethodPut:
		s.updateSSHKey(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func decodeSSHKeyRequest(w http.ResponseWriter, r *http.Request) (sshKeyRequest, error) {
	var req sshKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return sshKeyRequest{}, errors.New("invalid SSH key payload")
	}
	return req, nil
}

func (s *server) createSSHKey(w http.ResponseWriter, r *http.Request, user User) {
	req, err := decodeSSHKeyRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	title := strings.TrimSpace(req.Title)
	publicKey := strings.TrimSpace(req.PublicKey)
	if title == "" || publicKey == "" {
		writeError(w, http.StatusBadRequest, "title and public key are required")
		return
	}

	fingerprint, err := sshFingerprint(publicKey)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid SSH public key")
		return
	}

	if _, err := s.db.Exec(
		`INSERT INTO panel_ssh_keys (owner_email, title, public_key, fingerprint, enabled)
		 VALUES ($1, $2, $3, $4, TRUE)`,
		normalizeEmail(user.Email),
		title,
		publicKey,
		fingerprint,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save SSH key")
		return
	}

	if err := s.syncSSHAuthorizedKeys(); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("SSH key saved, but failed to sync authorized_keys: %v", err))
		return
	}

	keys, _ := s.loadSSHKeys()
	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"message": "SSH key saved successfully.",
		"keys":    keys,
	})
}

func (s *server) updateSSHKey(w http.ResponseWriter, r *http.Request) {
	req, err := decodeSSHKeyRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "key ID is required")
		return
	}

	var existing sshKeyItem
	var createdAt time.Time
	var updatedAt time.Time
	err = s.db.QueryRow(
		`SELECT id, owner_email, title, public_key, fingerprint, enabled, created_at, updated_at
		 FROM panel_ssh_keys WHERE id = $1`,
		req.ID,
	).Scan(&existing.ID, &existing.OwnerEmail, &existing.Title, &existing.PublicKey, &existing.Fingerprint, &existing.Enabled, &createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "SSH key not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load SSH key")
		return
	}

	enabled := existing.Enabled
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = existing.Title
	}
	publicKey := strings.TrimSpace(req.PublicKey)
	if publicKey == "" {
		publicKey = existing.PublicKey
	}
	fingerprint := existing.Fingerprint
	if publicKey != existing.PublicKey {
		if fingerprint, err = sshFingerprint(publicKey); err != nil {
			writeError(w, http.StatusBadRequest, "invalid SSH public key")
			return
		}
	}

	if _, err := s.db.Exec(
		`UPDATE panel_ssh_keys
		 SET title = $1, public_key = $2, fingerprint = $3, enabled = $4, updated_at = NOW()
		 WHERE id = $5`,
		title,
		publicKey,
		fingerprint,
		enabled,
		req.ID,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update SSH key")
		return
	}

	if err := s.syncSSHAuthorizedKeys(); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("SSH key updated, but failed to sync authorized_keys: %v", err))
		return
	}

	keys, _ := s.loadSSHKeys()
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "SSH key updated successfully.",
		"keys":    keys,
	})
}

func (s *server) deleteSSHKey(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}
	if !user.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	req, err := decodeSSHKeyRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.ID <= 0 {
		writeError(w, http.StatusBadRequest, "key ID is required")
		return
	}

	if _, err := s.db.Exec(`DELETE FROM panel_ssh_keys WHERE id = $1`, req.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete SSH key")
		return
	}

	if err := s.syncSSHAuthorizedKeys(); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("SSH key deleted, but failed to sync authorized_keys: %v", err))
		return
	}

	keys, _ := s.loadSSHKeys()
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "deleted",
		"message": "SSH key deleted successfully.",
		"keys":    keys,
	})
}

func (s *server) readDNSZone(domain string) ([]dnsRecordItem, error) {
	domain = normalizeDomain(domain)
	if domain == "" {
		return nil, errors.New("domain is required")
	}

	output, err := exec.Command("pdnsutil", "list-zone", domain).CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to load zone DNS: %s", strings.TrimSpace(string(output)))
	}

	lines := strings.Split(string(output), "\n")
	items := make([]dnsRecordItem, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "$ORIGIN") {
			continue
		}

		parts := strings.Split(line, "\t")
		if len(parts) < 5 {
			continue
		}

		name := strings.TrimSpace(parts[0])
		ttl, _ := strconv.Atoi(strings.TrimSpace(parts[1]))
		recordType := strings.ToUpper(strings.TrimSpace(parts[3]))
		if recordType == "SOA" {
			continue
		}

		content := strings.TrimSpace(strings.Join(parts[4:], "\t"))
		item := dnsRecordItem{
			Domain:  domain,
			Name:    displayDNSRecordName(name, domain),
			Type:    recordType,
			TTL:     ttl,
			Content: content,
		}

		if recordType == "MX" {
			fields := strings.Fields(content)
			if len(fields) > 0 {
				if prio, err := strconv.Atoi(fields[0]); err == nil {
					item.Prio = prio
					item.Content = strings.TrimSpace(strings.TrimPrefix(content, fields[0]))
				}
			}
		}

		items = append(items, item)
	}

	return items, nil
}

func (s *server) addDNSRRSet(domain, name, recordType string, ttl int, content string, priority int) error {
	domain = normalizeDomain(domain)
	name = normalizeDNSRecordName(name, domain)
	recordType = strings.ToUpper(strings.TrimSpace(recordType))
	content = strings.TrimSpace(content)
	if domain == "" || name == "" || recordType == "" || content == "" {
		return errors.New("domain, name, type, and content are required")
	}

	args := []string{"add-record", domain, name, recordType}
	if ttl > 0 {
		args = append(args, strconv.Itoa(ttl))
	}

	recordContent := content
	if recordType == "MX" {
		if priority <= 0 {
			priority = 10
		}
		recordContent = fmt.Sprintf("%d %s", priority, content)
	}

	args = append(args, recordContent)
	output, err := exec.Command("pdnsutil", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to save DNS record: %s", strings.TrimSpace(string(output)))
	}

	if output, err := exec.Command("pdnsutil", "rectify-zone", domain).CombinedOutput(); err != nil {
		return fmt.Errorf("failed to rectify zone DNS: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("pdns_control", "rediscover").CombinedOutput(); err != nil {
		return fmt.Errorf("failed to refresh zone DNS: %s", strings.TrimSpace(string(output)))
	}

	return nil
}

func (s *server) deleteDNSRRSet(domain, name, recordType string) error {
	domain = normalizeDomain(domain)
	name = normalizeDNSRecordName(name, domain)
	recordType = strings.ToUpper(strings.TrimSpace(recordType))
	if domain == "" || name == "" || recordType == "" {
		return errors.New("domain, name, and type are required")
	}

	output, err := exec.Command("pdnsutil", "delete-rrset", domain, name, recordType).CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to delete DNS record: %s", strings.TrimSpace(string(output)))
	}

	if output, err := exec.Command("pdnsutil", "rectify-zone", domain).CombinedOutput(); err != nil {
		return fmt.Errorf("failed to rectify zone DNS: %s", strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("pdns_control", "rediscover").CombinedOutput(); err != nil {
		return fmt.Errorf("failed to refresh zone DNS: %s", strings.TrimSpace(string(output)))
	}

	return nil
}

func (s *server) listDNSRecords(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	domain := normalizeDomain(r.URL.Query().Get("domain"))
	if domain == "" {
		writeError(w, http.StatusBadRequest, "domain is required")
		return
	}

	allowed, err := s.canManagePanelDomain(user, domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	records, err := s.readDNSZone(domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"records": records})
}

func (s *server) createDNSRecord(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	s.upsertDNSRecord(w, r, sess, false)
}

func (s *server) updateDNSRecord(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	s.upsertDNSRecord(w, r, sess, true)
}

func (s *server) upsertDNSRecord(w http.ResponseWriter, r *http.Request, sess sessionRow, isUpdate bool) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDNSRecordRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" || req.Name == "" || req.Type == "" {
		writeError(w, http.StatusBadRequest, "domain, name, and type are required")
		return
	}

	if !isValidDomainName(req.Domain) {
		writeError(w, http.StatusBadRequest, "invalid domain format")
		return
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	recordName := normalizeDNSRecordName(req.Name, req.Domain)
	recordType := strings.ToUpper(strings.TrimSpace(req.Type))
	if recordType == "" {
		writeError(w, http.StatusBadRequest, "type is required")
		return
	}
	if !isValidDNSRecordType(recordType) {
		writeError(w, http.StatusBadRequest, "DNS record type is not supported")
		return
	}

	ttl := req.TTL
	if ttl <= 0 {
		ttl = 3600
	}

	if isUpdate && strings.TrimSpace(req.OriginalName) != "" && strings.TrimSpace(req.OriginalType) != "" {
		oldName := normalizeDNSRecordName(req.OriginalName, req.Domain)
		oldType := strings.ToUpper(strings.TrimSpace(req.OriginalType))
		if oldName != recordName || oldType != recordType {
			if err := s.deleteDNSRRSet(req.Domain, oldName, oldType); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		}
	} else if isUpdate {
		if err := s.deleteDNSRRSet(req.Domain, recordName, recordType); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	if err := s.addDNSRRSet(req.Domain, recordName, recordType, ttl, req.Content, req.Priority); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	records, err := s.readDNSZone(req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "updated",
		"message": "DNS record saved successfully.",
		"records": records,
	})
}

func (s *server) deleteDNSRecord(w http.ResponseWriter, r *http.Request, sess sessionRow) {
	user, err := s.loadUser(sess.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session is invalid")
		return
	}

	req, err := decodeDNSRecordRequest(w, r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Domain == "" || req.Name == "" || req.Type == "" {
		writeError(w, http.StatusBadRequest, "domain, name, and type are required")
		return
	}

	allowed, err := s.canManagePanelDomain(user, req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify domain")
		return
	}
	if !allowed {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	recordName := normalizeDNSRecordName(req.Name, req.Domain)
	recordType := strings.ToUpper(strings.TrimSpace(req.Type))
	if err := s.deleteDNSRRSet(req.Domain, recordName, recordType); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	records, err := s.readDNSZone(req.Domain)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "deleted",
		"message": "DNS record deleted successfully.",
		"records": records,
	})
}

func (s *server) cleanupDomain(domain, publicPath string) error {
	var errs []string

	if output, err := exec.Command("pdnsutil", "delete-zone", normalizeDomain(domain)).CombinedOutput(); err != nil {
		errs = append(errs, fmt.Sprintf("pdnsutil delete-zone: %s", strings.TrimSpace(string(output))))
	}

	configPath := filepath.Join("/etc/nginx/sites-available", normalizeDomain(domain)+".conf")
	enabledPath := filepath.Join("/etc/nginx/sites-enabled", normalizeDomain(domain)+".conf")
	_ = os.Remove(configPath)
	_ = os.Remove(enabledPath)

	if err := os.RemoveAll(filepath.Join(s.sitesRoot, normalizeDomain(domain))); err != nil {
		errs = append(errs, fmt.Sprintf("remove webroot: %v", err))
	}
	_ = publicPath

	if err := s.removeMailDomain(domain); err != nil {
		errs = append(errs, err.Error())
	}

	if output, err := exec.Command("nginx", "-t").CombinedOutput(); err != nil {
		errs = append(errs, fmt.Sprintf("nginx -t: %s", strings.TrimSpace(string(output))))
	}
	if output, err := exec.Command("systemctl", "reload", "nginx").CombinedOutput(); err != nil {
		errs = append(errs, fmt.Sprintf("reload nginx: %s", strings.TrimSpace(string(output))))
	}
	if output, err := exec.Command("pdns_control", "rediscover").CombinedOutput(); err != nil {
		errs = append(errs, fmt.Sprintf("pdns_control rediscover: %s", strings.TrimSpace(string(output))))
	}

	if len(errs) > 0 {
		return errors.New(strings.Join(errs, "; "))
	}
	return nil
}

func (s *server) provisionDomain(domain, projectName, ownerEmail, publicPath string) error {
	domain = normalizeDomain(domain)
	projectName = strings.TrimSpace(projectName)

	if err := os.MkdirAll(publicPath, 0755); err != nil {
		return fmt.Errorf("failed to create folder public: %w", err)
	}

	indexPath := filepath.Join(publicPath, "index.html")
	title := domain
	if projectName != "" {
		title = projectName
	}
	indexHTML := fmt.Sprintf(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>%s</title>
    <style>
      body { margin:0; font-family: Inter, Arial, sans-serif; background:#e5e7eb; color:#0f172a; }
      .wrap { min-height:100vh; display:grid; place-items:center; padding:24px; }
      .card { width:min(720px, 100%%); background:#fff; border:1px solid #dbe4f0; border-radius:28px; padding:36px; box-shadow:0 24px 60px rgba(15,23,42,.08); }
      h1 { margin:0; font-size:36px; }
      p { line-height:1.7; color:#475569; }
      code { display:block; margin-top:18px; padding:16px 18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px; word-break:break-all; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>%s</h1>
        <p>Your domain has been provisioned through the Diworkin hosting panel.</p>
        <code>Public folder: %s</code>
      </div>
    </div>
  </body>
</html>`, html.EscapeString(title), html.EscapeString(title), html.EscapeString(publicPath))
	if err := os.WriteFile(indexPath, []byte(indexHTML), 0644); err != nil {
		return fmt.Errorf("failed to write index public: %w", err)
	}

	serverIP := s.serverIP()
	if serverIP == "" {
		return errors.New("server public IP is not available yet")
	}

	zoneFile, err := os.CreateTemp("", "diworkin-zone-*.zone")
	if err != nil {
		return fmt.Errorf("failed to prepare zone file: %w", err)
	}
	defer os.Remove(zoneFile.Name())

	zoneContent := fmt.Sprintf(`$ORIGIN %s.
$TTL 3600
@ IN SOA ns1.diworkin.com. hostmaster.diworkin.com. (
  %s
  3600
  900
  1209600
  3600
)
@ IN NS ns1.diworkin.com.
@ IN NS ns2.diworkin.com.
@ IN A %s
www IN A %s
`, domain, time.Now().UTC().Format("200601021504"), serverIP, serverIP)

	if _, err := zoneFile.WriteString(zoneContent); err != nil {
		_ = zoneFile.Close()
		return fmt.Errorf("failed to write zone file: %w", err)
	}
	if err := zoneFile.Close(); err != nil {
		return fmt.Errorf("failed to close zone file: %w", err)
	}

	output, err := exec.Command("pdnsutil", "load-zone", domain, zoneFile.Name()).CombinedOutput()
	if err != nil {
		lowerOutput := strings.ToLower(strings.TrimSpace(string(output)))
		if !strings.Contains(lowerOutput, "exists already") {
			return fmt.Errorf("failed to create zone DNS: %s", strings.TrimSpace(string(output)))
		}
		log.Printf("powerdns zone already exists for %s, continuing with existing zone", domain)
	} else {
		if output, err := exec.Command("pdnsutil", "check-zone", domain).CombinedOutput(); err != nil {
			return fmt.Errorf("DNS zone is invalid: %s", strings.TrimSpace(string(output)))
		}
		if output, err := exec.Command("pdnsutil", "rectify-zone", domain).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to rectify zone DNS: %s", strings.TrimSpace(string(output)))
		}
		if output, err := exec.Command("pdns_control", "rediscover").CombinedOutput(); err != nil {
			return fmt.Errorf("failed to reload PowerDNS: %s", strings.TrimSpace(string(output)))
		}
	}

	if err := writeHostNginxConfig(domain, publicPath, false); err != nil {
		return fmt.Errorf("failed to write konfigurasi nginx: %w", err)
	}

	if err := s.seedMailDomain(domain); err != nil {
		return err
	}

	log.Printf("domain provisioned: %s", domain)
	return nil
}

func (s *server) enableDomainHTTPS(fullDomain, ownerEmail, publicPath string) error {
	fullDomain = normalizeDomain(fullDomain)
	if fullDomain == "" {
		return errors.New("domain is empty")
	}

	if serverIP := s.serverIP(); serverIP != "" {
		_ = s.addDNSRRSet(fullDomain, "www", "A", 3600, serverIP, 0)
	}

	if err := s.issueHostCertificate(fullDomain, ownerEmail); err != nil {
		return err
	}
	if err := writeHostNginxConfig(fullDomain, publicPath, true); err != nil {
		return err
	}
	return nil
}

func (s *server) sendVerificationEmail(user User, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.panelBaseURL, token)
	subject := "Verify your Diworkin account email"
	htmlBody, textBody := renderVerificationEmail(user, verifyURL)
	log.Printf("verification email for %s: %s", user.Email, verifyURL)
	return s.sendEmail(user.Email, subject, htmlBody, textBody)
}

func renderVerificationEmail(user User, verifyURL string) (string, string) {
	name := html.EscapeString(strings.TrimSpace(user.Name))
	if name == "" {
		name = "there"
	}

	company := html.EscapeString(strings.TrimSpace(user.Company))

	escapedURL := html.EscapeString(verifyURL)
	subtitle := "Your panel account has been created"
	workspaceLine := "Please verify your email address to continue to the admin approval step."
	workspaceMeta := "This request was submitted through the Diworkin hosting panel."
	if company != "" {
		workspaceMeta = fmt.Sprintf("Workspace: %s", company)
	}

	htmlBody := fmt.Sprintf(`<!doctype html>
<html lang="id">
  <body style="margin:0;background:#e5e7eb;padding:24px;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.08);">
      <div style="background:linear-gradient(135deg,#0f172a 0%%,#1d4ed8 58%%,#38bdf8 100%%);padding:28px 32px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:16px;background:rgba(255,255,255,.16);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:18px;">D</div>
          <div>
            <div style="color:#fff;font-size:18px;font-weight:700;line-height:1;">Diworkin</div>
            <div style="color:rgba(255,255,255,.78);font-size:13px;margin-top:4px;">Hosting control panel</div>
          </div>
        </div>
      </div>
      <div style="padding:36px 32px 32px;">
        <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#64748b;font-weight:700;">Email verification</div>
        <h1 style="margin:12px 0 0;font-size:32px;line-height:1.1;color:#0f172a;">Welcome, %s</h1>
        <p style="margin:10px 0 0;font-size:14px;font-weight:600;line-height:1.7;color:#1d4ed8;">
          %s
        </p>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:#475569;">
          %s
        </p>
        <p style="margin:14px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
          %s
        </p>
        <div style="margin:22px 0 0;padding:16px 18px;border-left:4px solid #1877ff;background:#f8fbff;border-radius:18px;color:#334155;font-size:14px;line-height:1.8;">
          <strong style="color:#0f172a;">What happens next:</strong><br>
          After you verify this email, your account will stay pending until an admin approves access.
        </div>
        <div style="margin:28px 0;">
          <a href="%s" style="display:inline-block;background:#1877ff;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:16px 26px;border-radius:18px;box-shadow:0 16px 28px rgba(24,119,255,.22);">
            Verify email address
          </a>
        </div>
        <div style="padding:18px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;color:#475569;font-size:14px;line-height:1.8;">
          If the button does not work, copy and paste this link into your browser:<br>
          <span style="word-break:break-all;color:#0f172a;font-weight:600;">%s</span>
        </div>
        <p style="margin:26px 0 0;font-size:13px;line-height:1.8;color:#94a3b8;">
          This verification email was sent by the Diworkin hosting panel.
        </p>
      </div>
    </div>
  </body>
</html>`, name, subtitle, workspaceLine, workspaceMeta, escapedURL, escapedURL)

	textBody := fmt.Sprintf(
		"Diworkin email verification\n\nHi %s,\n\n%s\n\n%s\n\n%s\n\nVerify your email here:\n%s\n\nAfter verification, the account will still need admin approval before you can log in.\n\nIf you did not request this, you can ignore this email.\n",
		strings.TrimSpace(user.Name),
		subtitle,
		workspaceLine,
		workspaceMeta,
		verifyURL,
	)

	return htmlBody, textBody
}

func (s *server) sendEmail(to, subject, htmlBody, textBody string) error {
	fromHeader := strings.TrimSpace(s.smtpFrom)
	if fromHeader == "" {
		fromHeader = "Diworkin Panel <no-reply@diworkin.com>"
	}
	return s.sendMailMessage(extractEnvelopeAddress(fromHeader), fromHeader, []string{to}, nil, []string{to}, subject, htmlBody, textBody)
}

func extractEnvelopeAddress(from string) string {
	start := strings.Index(from, "<")
	end := strings.LastIndex(from, ">")
	if start >= 0 && end > start {
		addr := strings.TrimSpace(from[start+1 : end])
		if addr != "" {
			return addr
		}
	}
	return strings.TrimSpace(from)
}

func collectMetrics() Metrics {
	metrics := Metrics{
		CPU:      fallbackMetrics.CPU,
		RAM:      fallbackMetrics.RAM,
		Disk:     fallbackMetrics.Disk,
		Hostname: hostnameOrUnknown(),
		Source:   "go-backend",
	}

	metrics.CPU = cpuUsageOr(metrics.CPU)
	metrics.RAM = memoryUsageOr(metrics.RAM)
	metrics.Disk = diskUsageOr(metrics.Disk, "/")
	metrics.NetworkRxBytes, metrics.NetworkTxBytes = networkUsage()
	metrics.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	return metrics
}

func networkUsage() (int64, int64) {
	data, err := os.ReadFile("/proc/net/dev")
	if err != nil {
		return 0, 0
	}

	var rxTotal int64
	var txTotal int64
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "Inter-") || strings.HasPrefix(line, "face") {
			continue
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}

		iface := strings.TrimSpace(parts[0])
		if iface == "" || iface == "lo" {
			continue
		}

		fields := strings.Fields(parts[1])
		if len(fields) < 16 {
			continue
		}

		rx, err := strconv.ParseInt(fields[0], 10, 64)
		if err != nil {
			continue
		}
		tx, err := strconv.ParseInt(fields[8], 10, 64)
		if err != nil {
			continue
		}

		rxTotal += rx
		txTotal += tx
	}

	return rxTotal, txTotal
}

func cpuUsageOr(fallback int) int {
	current, err := readCPUSample()
	if err != nil {
		return fallback
	}

	prev, err := readCPUSampleFromFile("/tmp/diworkin_cpu_sample")
	if err != nil {
		_ = writeCPUTrace("/tmp/diworkin_cpu_sample", current)
		return fallback
	}

	_ = writeCPUTrace("/tmp/diworkin_cpu_sample", current)
	if current.total <= prev.total || current.idle < prev.idle {
		return fallback
	}

	totalDelta := float64(current.total - prev.total)
	idleDelta := float64(current.idle - prev.idle)
	if totalDelta <= 0 {
		return fallback
	}

	usage := 100 * (1 - idleDelta/totalDelta)
	return clampInt(math.Round(usage), fallback)
}

func memoryUsageOr(fallback int) int {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return fallback
	}

	var totalKB uint64
	var availableKB uint64
	for _, line := range strings.Split(string(data), "\n") {
		switch {
		case strings.HasPrefix(line, "MemTotal:"):
			totalKB = parseMeminfoKB(line)
		case strings.HasPrefix(line, "MemAvailable:"):
			availableKB = parseMeminfoKB(line)
		}
	}

	if totalKB == 0 {
		return fallback
	}

	used := float64(totalKB-availableKB) / float64(totalKB) * 100
	return clampInt(math.Round(used), fallback)
}

func diskUsageOr(fallback int, path string) int {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(path, &stat); err != nil {
		return fallback
	}

	total := float64(stat.Blocks) * float64(stat.Bsize)
	free := float64(stat.Bavail) * float64(stat.Bsize)
	if total <= 0 {
		return fallback
	}

	used := (total - free) / total * 100
	return clampInt(math.Round(used), fallback)
}

func readCPUSample() (cpuSample, error) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return cpuSample{}, err
	}

	for _, line := range strings.Split(string(data), "\n") {
		if !strings.HasPrefix(line, "cpu ") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 5 {
			break
		}

		values := make([]uint64, 0, len(fields)-1)
		for _, field := range fields[1:] {
			v, err := strconv.ParseUint(field, 10, 64)
			if err != nil {
				continue
			}
			values = append(values, v)
		}

		if len(values) == 0 {
			break
		}

		var total uint64
		for _, value := range values {
			total += value
		}

		idle := values[3]
		if len(values) > 4 {
			idle += values[4]
		}

		return cpuSample{total: total, idle: idle}, nil
	}

	return cpuSample{}, errors.New("cpu sample not found")
}

type cpuSample struct {
	total uint64
	idle  uint64
}

func readCPUSampleFromFile(path string) (cpuSample, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return cpuSample{}, err
	}

	parts := strings.Fields(string(data))
	if len(parts) != 2 {
		return cpuSample{}, errors.New("invalid cpu trace")
	}

	total, err := strconv.ParseUint(parts[0], 10, 64)
	if err != nil {
		return cpuSample{}, err
	}

	idle, err := strconv.ParseUint(parts[1], 10, 64)
	if err != nil {
		return cpuSample{}, err
	}

	return cpuSample{total: total, idle: idle}, nil
}

func writeCPUTrace(path string, sample cpuSample) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	return os.WriteFile(path, []byte(fmt.Sprintf("%d %d", sample.total, sample.idle)), 0o600)
}

func parseMeminfoKB(line string) uint64 {
	fields := strings.Fields(line)
	if len(fields) < 2 {
		return 0
	}

	v, err := strconv.ParseUint(fields[1], 10, 64)
	if err != nil {
		return 0
	}

	return v
}

func clampInt(v float64, fallback int) int {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return fallback
	}
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return int(math.Round(v))
}

func hostnameOrUnknown() string {
	host, err := os.Hostname()
	if err != nil || host == "" {
		return "unknown"
	}
	return host
}

func randomToken(length int) (string, error) {
	if length <= 0 {
		return "", errors.New("invalid token length")
	}

	data := make([]byte, length)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}

	return hex.EncodeToString(data), nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func getInitials(name, fallback string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		if fallback == "" {
			return "DW"
		}
		return fallback
	}

	var builder strings.Builder
	for i := 0; i < len(parts) && i < 2; i++ {
		part := parts[i]
		if part == "" {
			continue
		}
		builder.WriteString(strings.ToUpper(part[:1]))
	}

	if builder.Len() == 0 {
		if fallback == "" {
			return "DW"
		}
		return fallback
	}

	return builder.String()
}

func envOr(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func envBool(key string, fallback bool) bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if value == "" {
		return fallback
	}

	switch value {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("encode json: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func isUniqueViolation(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "duplicate key")
}
