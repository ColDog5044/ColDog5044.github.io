---
layout: post
title: "How to Configure Enterprise CA and Deploy LDAPS Certificates"
date: 2025-12-24 08:00:00 -0500
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, pki, certificate-authority, ldaps, ssl, tls, security, sysadmin]
---

## Introduction

LDAPS (LDAP over SSL/TLS) provides encrypted communication for Active Directory LDAP queries, protecting sensitive directory data from eavesdropping and tampering. In this guide, we'll configure an Enterprise Certificate Authority (CA) and create a custom certificate template specifically for domain controllers to enable LDAPS.

This guide is tailored for homelab environments where you can safely experiment with PKI (Public Key Infrastructure) concepts. We'll configure shorter certificate lifetimes to practice the renewal process - a critical skill for managing production environments where certificate expiration can cause major outages.

> **Prerequisites:**  
> - A functioning Active Directory domain with at least one domain controller
> - Domain Administrator credentials
> - A server to host the Certificate Authority (can be a DC, but a dedicated server is recommended for production)
{: .prompt-info }

> **Homelab Note:**  
> For homelab purposes, installing the CA role on a domain controller is acceptable and saves resources. In production environments, you should use a dedicated CA server to separate roles and improve security.
{: .prompt-tip }

## Why Use an Enterprise CA for LDAPS?

An Enterprise CA integrated with Active Directory provides several advantages:

- **Automatic Certificate Enrollment**: DCs can automatically request and renew certificates
- **Certificate Templates**: Create custom templates tailored for specific services
- **Centralized Management**: Manage all certificates from a single location
- **Group Policy Integration**: Deploy certificates via Group Policy
- **Auditing and Compliance**: Track certificate issuance and usage

## Part 1: Install Active Directory Certificate Services

### Install the CA Role

1. Open **Server Manager** on the server that will host the CA.
2. Navigate to **Manage > Add Roles and Features**.
3. Click **Next** through the wizard until you reach **Server Roles**.
4. Select **Active Directory Certificate Services**.
5. Click **Add Features** when prompted.
6. On the **AD CS** page, click **Next**.
7. On the **Role Services** page, select:
   - **Certification Authority** (required)
   - **Certification Authority Web Enrollment** (optional, but useful for web-based certificate requests)
8. Click **Next** through the remaining pages.
9. Click **Install** to install the role.

> **Note:**  
> Do not close the wizard after installation completes, as we need to configure AD CS next.
{: .prompt-warning }

### Configure the Certificate Authority

1. After installation completes, click **Configure Active Directory Certificate Services** in the wizard.

2. **Credentials**:  
   - Ensure you're using Domain Admin credentials
   - Click **Next**

3. **Role Services**:  
   - Check **Certification Authority**
   - Check **Certification Authority Web Enrollment** if you installed it
   - Click **Next**

4. **Setup Type**:  
   - Select **Enterprise CA**
   - Click **Next**

> **Note:**  
> Enterprise CAs integrate with Active Directory and support certificate templates and auto-enrollment. Standalone CAs do not have these features.
{: .prompt-info }

5. **CA Type**:  
   - Select **Root CA** (if this is your first CA)
   - Select **Subordinate CA** (if you're creating a subordinate CA under an existing root)
   - Click **Next**

> **Warning:**  
> For production environments, consider using a two-tier PKI hierarchy (offline root CA with subordinate issuing CAs). For homelabs, a single root CA is typically sufficient.
{: .prompt-tip }

6. **Private Key**:  
   - Select **Create a new private key**
   - Click **Next**

7. **Cryptography**:  
   - **Cryptographic Provider**: RSA#Microsoft Software Key Storage Provider
   - **Key Length**: 4096 (recommended for security)
   - **Hash Algorithm**: SHA256 (or higher)
   - Click **Next**

8. **CA Name**:  
   - Enter a descriptive name for your CA (e.g., `ColDogStudios-Enterprise-CA`)
   - Click **Next**

9. **Validity Period**:  
   - Set the validity period for the CA certificate (default is 5 years)
   - **For production**: 10-20 years for a root CA (the CA certificate itself)
   - **For homelab**: 5-10 years is sufficient
   - Click **Next**

> **Understanding CA Certificate Lifetime:**  
> The CA certificate lifetime determines how long your CA can issue certificates. It should be significantly longer than any certificate it issues. Once the CA certificate expires, it can no longer issue new certificates until you renew it or create a new CA.
{: .prompt-info }

10. **Certificate Database**:  
    - Review the default locations or change if needed
    - Click **Next**

11. **Confirmation**:  
    - Review your settings
    - Click **Configure**

12. After configuration completes, click **Close**.

### Verify CA Installation

1. Open **Certification Authority** from Server Manager > Tools.
2. Expand your CA name and verify you see:
   - Revoked Certificates
   - Issued Certificates
   - Pending Requests
   - Failed Requests
   - Certificate Templates

## Part 2: Create a Domain Controller Certificate Template

We'll create a custom certificate template based on the Domain Controller Authentication template.

### Duplicate the Domain Controller Template

1. Open **Certification Authority** from Server Manager > Tools.
2. Expand your CA name.
3. Right-click **Certificate Templates** and select **Manage**.
4. In the Certificate Templates Console, locate **Domain Controller Authentication**.
5. Right-click **Domain Controller Authentication** and select **Duplicate Template**.

### Configure the New Template - General Tab

1. On the **General** tab:
   - **Template display name**: `Domain Controller LDAPS`
   - **Template name**: `DomainControllerLDAPS` (no spaces)
   - **Validity period**: See certificate lifetime guidance below
   - **Renewal period**: See certificate lifetime guidance below
   - Check **Publish certificate in Active Directory**

> **Certificate Lifetime - Homelab vs Production:**  
> **For Homelab/Learning**: Use shorter lifetimes to practice the renewal process:
> - **Validity period**: 90 days (3 months)
> - **Renewal period**: 2 weeks before expiration
> 
> This lets you experience certificate renewal every few months, helping you understand the auto-enrollment process and troubleshoot renewal issues in a safe environment.
>
> **For Production**: Use industry-standard lifetimes:
> - **Validity period**: 1-2 years
> - **Renewal period**: 6 weeks before expiration
>
> Enterprise environments typically use 1-2 year certificates to balance security (shorter is more secure) with administrative overhead (longer requires fewer renewals).
{: .prompt-tip }

> **Why Practice Renewals?**  
> Certificate expiration is one of the most common causes of outages in enterprise environments. By using short-lived certificates in your homelab, you'll quickly encounter and resolve renewal issues, building muscle memory for production scenarios.
{: .prompt-info }

### Configure Request Handling Tab

1. Switch to the **Request Handling** tab:
   - **Purpose**: Signature and encryption
   - Check **Allow private key to be exported** (useful for backup/migration)
   - Ensure **Renew with same key** is unchecked (better security to generate new keys)

> **What does "Renew with same key" mean?**  
> When unchecked, each certificate renewal generates a new public/private key pair. This is more secure because if an old key was compromised, the new certificate won't be affected. For domain controllers, generating new keys with each renewal is the recommended practice.
{: .prompt-info }

### Configure Subject Name Tab

1. Switch to the **Subject Name** tab:
   - Select **Build from this Active Directory information**
   - **Subject name format**: Distinguished name
   - Under **Include this information in alternate subject name**, check:
     - [x] DNS name
     - [x] User principal name (UPN)
   - Ensure **Use subject information from existing certificates for autoenrollment renewal requests** is checked

### Configure Extensions Tab

1. Switch to the **Extensions** tab:
2. Select **Application Policies** and click **Edit**.
3. Verify the following are present:
   - Client Authentication (1.3.6.1.5.5.7.3.2)
   - Server Authentication (1.3.6.1.5.5.7.3.1)
4. Click **OK**.

5. Select **Key Usage** and click **Edit**.
6. Ensure the following are checked:
   - Digital Signature
   - Key Encipherment
7. Click **OK**.

### Configure Security Tab

1. Switch to the **Security** tab:
2. Click **Add** and add **Domain Controllers** group.
3. For the **Domain Controllers** group, set the following permissions:
   - **Read**: Allow
   - **Enroll**: Allow
   - **Autoenroll**: Allow

4. Optionally add **Domain Admins** with Full Control for management.

> **Important:**  
> The Domain Controllers group must have Read, Enroll, and Autoenroll permissions for automatic certificate deployment to work.
{: .prompt-warning }

5. Click **OK** to save the template.
6. Close the Certificate Templates Console.

### Enable the Template on the CA

1. In the **Certification Authority** console, right-click **Certificate Templates**.
2. Select **New > Certificate Template to Issue**.
3. Select **Domain Controller LDAPS** from the list.
4. Click **OK**.

The template is now available for issuance.

## Part 3: Configure Group Policy for Auto-Enrollment

We'll configure Group Policy to enable automatic certificate enrollment for domain controllers.

### Create or Edit a Group Policy Object

1. Open **Group Policy Management** from Server Manager > Tools.
2. Navigate to your domain.
3. Right-click **Domain Controllers** OU and select **Create a GPO in this domain, and Link it here...**.
4. Name the GPO: `Certificate Auto-Enrollment - Domain Controllers`.
5. Right-click the new GPO and select **Edit**.

### Configure Computer Certificate Auto-Enrollment

1. In the Group Policy Editor, navigate to:  
   **Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies**

2. Double-click **Certificate Services Client - Auto-Enrollment**.

3. Configure the following settings:
   - **Configuration Model**: Enabled
   - [x] **Renew expired certificates, update pending certificates, and remove revoked certificates**
   - [x] **Update certificates that use certificate templates**
   - Click **OK**

### Force Group Policy Update

On each domain controller, run the following command to apply the Group Policy immediately:

```powershell
gpupdate /force
```

## Part 4: Verify Certificate Enrollment

### Check Certificate Enrollment on Domain Controllers

1. On each domain controller, open **certlm.msc** (Local Computer Certificates).
2. Navigate to **Personal > Certificates**.
3. Look for a certificate with:
   - **Issued To**: Your domain controller FQDN
   - **Issued By**: Your CA name
   - **Certificate Template**: Domain Controller LDAPS
   - **Intended Purposes**: Server Authentication, Client Authentication

> **Note:**  
> If the certificate doesn't appear immediately, wait a few minutes for the auto-enrollment policy to process. You can also restart the server to speed up the process.
{: .prompt-info }

### Force Certificate Enrollment Manually

If the certificate doesn't enroll automatically, you can force enrollment:

```powershell
# Request certificates from the CA
certreq -enroll -machine -q

# Or use the Certificate MMC
# Open certlm.msc > Personal > Right-click > All Tasks > Request New Certificate
```

### Verify Certificate Properties

1. Double-click the certificate to open its properties.
2. On the **Details** tab, verify:
   - **Subject**: Contains your DC's distinguished name
   - **Subject Alternative Name**: Contains DNS names and UPN
   - **Enhanced Key Usage**: Server Authentication and Client Authentication
3. On the **Certification Path** tab:
   - Verify the certificate chains to your root CA
   - Ensure there are no errors

## Part 5: Verify LDAPS Functionality

### Test LDAPS Connectivity

LDAPS uses port 636 (instead of LDAP's port 389).

```powershell
# Test LDAPS connectivity using PowerShell
$ldapsConnection = New-Object System.DirectoryServices.DirectoryEntry("LDAPS://dc1.yourdomain.com:636")
$ldapsConnection.distinguishedName
```

If successful, this will return the distinguished name of your domain.

### Test Using LDP.exe

1. Open **LDP.exe** (LDAP Data Interchange Format tool).
2. Go to **Connection > Connect**.
3. In the **Server** field, enter your DC's FQDN.
4. In the **Port** field, enter `636`.
5. Check **SSL**.
6. Click **OK**.

If the connection succeeds, you'll see "Connected" in the output window.

### Verify Using OpenSSL

From a Linux machine or Windows with OpenSSL:

```bash
openssl s_client -connect dc1.yourdomain.com:636 -showcerts
```

This will display the certificate chain and verify the SSL/TLS connection.

### Test Using PowerShell ADSI

```powershell
# Test LDAPS connection
$searcher = New-Object System.DirectoryServices.DirectorySearcher
$searcher.SearchRoot = "LDAPS://dc1.yourdomain.com:636/DC=yourdomain,DC=com"
$searcher.Filter = "(objectClass=user)"
$searcher.PropertiesToLoad.Add("cn") | Out-Null
$results = $searcher.FindAll()
Write-Host "Found $($results.Count) users via LDAPS"
```

## Part 6: Monitor and Maintain

### Enable LDAPS Event Logging

To troubleshoot LDAPS issues, enable diagnostic logging:

1. Open **Registry Editor** (regedit.exe).
2. Navigate to:  
   `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics`
3. Set the following values to `2` (or higher for more detailed logging):
   - `16 LDAP Interface Events`
   - `24 LDAP Client`
4. Restart the domain controller or restart the NTDS service.

View LDAPS events in **Event Viewer** under **Applications and Services Logs > Directory Service**.

### Monitor Certificate Expiration

Set up monitoring to alert before certificates expire:

```powershell
# Check certificate expiration dates
Get-ChildItem Cert:\LocalMachine\My | Where-Object {
    $_.Subject -like "*DC1*" -and $_.NotAfter -lt (Get-Date).AddDays(60)
} | Select-Object Subject, NotAfter, Thumbprint
```

### Configure Auto-Renewal

Ensure certificates renew automatically:

- Verify the **Renewal period** in your certificate template is set appropriately (e.g., 2 weeks for homelab, 6 weeks for production)
- Confirm the Group Policy for auto-enrollment is still applied
- Check the Event Viewer for auto-enrollment errors

> **How Auto-Renewal Works:**  
> When a certificate reaches its renewal period (e.g., 2 weeks before expiration), the auto-enrollment policy automatically requests a new certificate from the CA. The domain controller seamlessly transitions to the new certificate without manual intervention or service disruption.
{: .prompt-info }

## Part 7: Practice Certificate Renewal (Homelab)

If you configured short-lived certificates (90 days), you'll get to practice the renewal process regularly. Here's how to monitor and force renewals for learning purposes.

### Monitor Upcoming Renewals

```powershell
# Check when certificates will expire
Get-ChildItem Cert:\LocalMachine\My | Where-Object {
    $_.Subject -like "*DC*" -and $_.NotAfter -lt (Get-Date).AddDays(30)
} | Select-Object Subject, NotAfter, @{Name="DaysUntilExpiration";Expression={($_.NotAfter - (Get-Date)).Days}}

# More detailed certificate information
Get-ChildItem Cert:\LocalMachine\My | Where-Object {
    $_.Extensions | Where-Object {$_.Oid.FriendlyName -eq "Certificate Template Information"}
} | ForEach-Object {
    [PSCustomObject]@{
        Subject = $_.Subject
        Issuer = $_.Issuer
        NotBefore = $_.NotBefore
        NotAfter = $_.NotAfter
        DaysRemaining = ($_.NotAfter - (Get-Date)).Days
        Thumbprint = $_.Thumbprint
    }
} | Format-Table -AutoSize
```

### Force Certificate Renewal Manually

To practice the renewal process before auto-enrollment kicks in:

```powershell
# Trigger certificate auto-enrollment immediately
certreq -autoenroll -user
certreq -autoenroll -machine

# Alternative: Use certutil to trigger enrollment
certutil -pulse
```

### Verify Renewal in Event Viewer

Check Event Viewer for auto-enrollment activity:

1. Open **Event Viewer**
2. Navigate to: **Applications and Services Logs > Microsoft > Windows > CertificateServicesClient-AutoEnrollment > Operational**
3. Look for Event IDs:
   - **Event ID 4**: Successfully completed automatic certificate enrollment
   - **Event ID 13**: Certificate enrollment initiated
   - **Event ID 19**: Certificate renewal request submitted
   - **Event ID 20**: Certificate renewal successful

### Simulate Certificate Expiration (Advanced)

For testing purposes, you can manually expire a certificate:

```powershell
# WARNING: This is for testing only - do not do this on production systems!

# 1. On the CA server, reduce the certificate template validity to 1 day
# 2. Force immediate enrollment
certutil -pulse

# 3. After certificate is issued, change the template back to normal validity
# 4. Wait for the certificate to enter renewal period (auto-enrollment will renew it)
```

### Track Renewal History

Create a script to log certificate renewals:

```powershell
# Save as C:\Scripts\track-cert-renewals.ps1
$logFile = "C:\Logs\cert-renewal-history.csv"

# Get current certificates
$currentCerts = Get-ChildItem Cert:\LocalMachine\My | Where-Object {
    $_.Subject -like "*DC*"
}

foreach ($cert in $currentCerts) {
    $logEntry = [PSCustomObject]@{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Subject = $cert.Subject
        Thumbprint = $cert.Thumbprint
        NotBefore = $cert.NotBefore
        NotAfter = $cert.NotAfter
        DaysValid = ($cert.NotAfter - $cert.NotBefore).Days
    }
    
    $logEntry | Export-Csv $logFile -Append -NoTypeInformation
}

# Schedule this script to run daily to track certificate changes
```

### Common Renewal Scenarios

**Scenario 1: Auto-Enrollment Works Perfectly**
- Certificate reaches renewal period (2 weeks before expiration)
- Auto-enrollment requests new certificate automatically
- New certificate is issued and installed
- Old certificate remains until expiration
- LDAPS continues working without interruption

**Scenario 2: Manual Intervention Required**
- Check Group Policy is still applied: `gpresult /r`
- Verify CA is online and accessible
- Check certificate template permissions
- Force enrollment: `certutil -pulse`

**Scenario 3: Certificate Expires Before Renewal**
- LDAPS will stop working on port 636
- You'll need to manually request a new certificate
- This is a great learning experience - document your troubleshooting steps!

> **Homelab Exercise:**  
> With 90-day certificates, you'll experience renewal approximately every 3 months. Each time, document the process, check Event Viewer logs, and verify the new certificate. This builds real-world skills for managing enterprise PKI.
{: .prompt-tip }

## Troubleshooting

### Certificate Not Enrolling

```powershell
# Check CA connectivity
certutil -ping

# View certificate enrollment status
certutil -pulse

# Check auto-enrollment policy
gpresult /h gpresult.html
# Open gpresult.html and check for Certificate Services Client settings
```

### LDAPS Not Working

```powershell
# Verify port 636 is listening
netstat -an | findstr :636

# Check certificate is in the correct store
Get-ChildItem Cert:\LocalMachine\My

# Restart NTDS service
Restart-Service NTDS -Force
```

### Certificate Template Not Showing

- Verify the template is published on the CA (**Certificate Templates** folder in CA console)
- Ensure Domain Controllers group has Enroll and Autoenroll permissions
- Run `gpupdate /force` on domain controllers
- Check Event Viewer for enrollment errors (Event ID 13, 19, 53)

### Certificate Chain Issues

```powershell
# Verify root CA certificate is in Trusted Root store
Get-ChildItem Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*CA*"}

# Publish root certificate to AD (run on CA server)
certutil -dspublish -f "C:\path\to\rootca.cer" RootCA
```

## Security Best Practices

1. **Secure the CA Server**:
   - Keep the CA server patched and updated
   - Restrict physical and network access
   - Enable auditing for certificate operations

2. **Use Strong Cryptography**:
   - Use at least 2048-bit keys (4096-bit recommended)
   - Use SHA256 or higher for hash algorithms
   - Avoid deprecated algorithms (MD5, SHA1)

3. **Implement Certificate Lifecycle Management**:
   - Set appropriate validity periods (90 days for homelab practice, 1-2 years for production)
   - Monitor certificate expiration with automated alerts
   - Test renewal process regularly
   - Revoke compromised certificates immediately
   - Document your certificate renewal procedures

4. **Backup the CA**:
   - Regularly backup the CA database and private key
   - Store backups securely and test restoration procedures
   - Document the CA recovery process

5. **Require LDAPS**:
   - After deploying certificates, consider disabling unencrypted LDAP
   - Use Group Policy to enforce LDAP signing and channel binding

## Summary

You now have a fully functional Enterprise CA and LDAPS deployment:

- [x] Enterprise Certificate Authority installed and configured
- [x] Custom certificate template for domain controllers created
- [x] Auto-enrollment configured via Group Policy
- [x] LDAPS certificates deployed to all domain controllers
- [x] LDAPS connectivity verified and tested
- [x] Certificate renewal process understood and ready to practice

This provides encrypted LDAP communications throughout your Active Directory environment, protecting sensitive directory data from interception.

**Homelab Learning Path:**
With short-lived certificates (90 days), you'll gain hands-on experience with certificate renewals every few months. This practical experience is invaluable for understanding PKI operations and troubleshooting certificate issues in production environments where certificate expiration can cause critical outages affecting thousands of users.

## Next Steps

- Create certificate templates for other services (web servers, VPN, etc.)
- Configure LDAP signing and channel binding requirements
- Implement certificate revocation checking (CRL/OCSP)
- Set up certificate monitoring and alerting
- Consider implementing a two-tier PKI for production environments

## Resources

- [Active Directory Certificate Services Overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/active-directory-certificate-services-overview)
- [Enable LDAP over SSL](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/enable-ldap-over-ssl-3rd-certification-authority)
- [Certificate Templates](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/configure-server-certificate-autoenrollment)
- [LDAP Signing and Channel Binding](https://support.microsoft.com/en-us/topic/use-the-ldapenforcechannelbinding-registry-entry-to-make-ldap-authentication-over-ssl-tls-more-secure-e9ecfa27-5e57-8519-6ba3-d2c06b38d034)
- [PKI Best Practices](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/dn786443(v=ws.11))
