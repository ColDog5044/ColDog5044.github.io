---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 2"
date: 2025-05-10 12:00:00 -0400
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory,domain-controller, sysadmin, networking]
---

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

3. Enter a strong password for the **Directory Services Restore Mode (DSRM)**. Ensure you store it in a safe place in case you need to restore the domain.
4. Skip **DNS delegation** unless you have specific DNS requirements.
5. Enter your desired **NetBIOS name**.  
   - If using a subdomain (e.g., `ad.coldogstudios.com`) and you want your actual domain name (`coldogstudios.com`) to show, enter `COLDOGSTUDIOS`.
6. You can change the default paths for the AD DS database, log files, and SYSVOL.  
   - If you change these paths, document them carefully, as most online resources reference the default paths.
7. After the prerequisites have been checked, click **Install** to promote the server to a domain controller.

## Resources

  - Microsoft Domain Naming Conventions: <https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/naming-conventions-for-computer-domain-site-ou#domain-names>
