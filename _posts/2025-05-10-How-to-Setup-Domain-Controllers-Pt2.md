---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 2"
date: 2025-05-10 12:00:00 -0400
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, domain-controller, sysadmin, networking]
---

## Prerequisites

Before proceeding with this guide, ensure you have completed the following:

> **Required:**  
> Complete [Part 1: How to Setup Domain Controllers on Windows Server 2025]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt1 %}) which covers:
> - Windows Server 2025 installation
> - Administrator password configuration
> - Timezone and network settings (static IP address)
> - Server renamed with appropriate naming convention
> - All drivers installed
> - Windows updates applied
{: .prompt-info }

Your server should now be fully configured and ready to be promoted to a domain controller.

## Install the Active Directory Domain Services Role

1. Open **Server Manager**.
2. Navigate to **Manage > Add Roles and Features**.
3. Skip the first page of the wizard.
4. Select **Role-based or feature-based installation**.
5. Ensure you are installing the role on your server.
6. Select the **Active Directory Domain Services** role.
7. Skip the features selection.
8. Select **Restart the destination server automatically if required**, then click **Install** to install the AD DS role.

## Promote the Server to a Domain Controller

1. Click **Promote this server to a domain controller**.
2. Select **Add a new forest** and enter your desired domain.

> **Warning:**  
> It is not recommended to use a `.local` domain for several reasons. Microsoft recommends using a fully-qualified domain name (FQDN) such as `coldogstudios.com`. However, if your domain has an internet presence, use a subdomain such as `ad.coldogstudios.com` to prevent DNS issues.
{: .prompt-warning }

3. Enter a strong password for the **Directory Services Restore Mode (DSRM)**. Ensure you document and store it in a safe place.

> **Note:**  
> Directory Services Restore Mode (DSRM) Password The DSRM password is a critical credential used for offline maintenance and disaster recovery of Active Directory Domain Controllers. It allows administrators to boot into safe mode, perform repairs, restore backups, and troubleshoot issues without relying on domain authentication. Since it's a security-sensitive account, it's recommended to store it securely and update it periodically to prevent unauthorized access.
{: .prompt-info }

4. Skip **DNS delegation** unless you have specific DNS requirements.
5. Enter your desired **NetBIOS name**.

> **Note:**  
> If using a subdomain (e.g., `ad.coldogstudios.com`) and you want your actual domain name (`coldogstudios.com`) to show, enter `COLDOGSTUDIOS`.
{: .prompt-info }

6. You can change the default paths for the AD DS database, log files, and SYSVOL.

> **Warning:**  
> If you change these paths, document them carefully, as most online resources reference the default paths.
{: .prompt-warning }

7. After the prerequisites have been checked, click **Install** to promote the server to a domain controller.

## Resources

- Microsoft Domain Naming Conventions: <https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/naming-conventions-for-computer-domain-site-ou#domain-names>
