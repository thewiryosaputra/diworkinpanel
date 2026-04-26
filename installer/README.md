# Diworkin Installer

This bundle installs the current Diworkin stack on a fresh Ubuntu server.

## Contents

- Panel API and admin dashboard
- Marketing site
- Mail stack
- DNS / PowerDNS setup
- SSL / DKIM / Roundcube

## Supported setup

- Ubuntu 24.04 LTS recommended
- Root or sudo access
- DNS for `diworkin.com` and `panel.diworkin.com` should already point to the target server for Let's Encrypt to work immediately

## License connection

If you want to bind the installer to a license from the admin panel, set these values in `installer/config.env`:

```bash
LICENSE_API_URL=https://panel.diworkin.com/api/licenses/verify
LICENSE_KEY=LIC-XXXX-XXXX-XXXX-XXXX
LICENSE_DOMAIN=example.com
LICENSE_PRODUCT=Diworkin Hosting
LICENSE_TYPE=hosting
```

Flow:

1. Create a license from the admin panel.
2. Copy the generated license key.
3. Put the key and license API URL into `installer/config.env`.
4. Run the installer.
5. The installer will verify the license before continuing.

## Quick start

1. Copy the sample config:

```bash
cp installer/config.env.example installer/config.env
```

2. Edit `installer/config.env` once:

```bash
nano installer/config.env
```

3. Run the installer:

```bash
sudo ./installer/install.sh
```

You can also override on the command line if needed:

```bash
sudo MODE=update DOMAIN=example.com PANEL_HOST=panel.example.com MAIL_HOST=mail.example.com ./installer/install.sh
```

## Build the zip

```bash
./installer/build-installer.sh
```

The zip will be written to:

```text
dist/diworkin-installer.zip
```
