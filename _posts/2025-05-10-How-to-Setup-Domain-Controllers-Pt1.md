---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 1"
date: 2025-05-10 10:30:00 -0400
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory,domain-controller, sysadmin, networking]
---

## Install Windows Server

1. **Download Windows Server 2025**:  
   Obtain the ISO file from the official Microsoft website or your MSDN subscription.

2. **Create a Bootable USB**:  
   Use a tool like Rufus or the Windows Media Creation Tool to create a bootable USB drive with the Windows Server ISO.

3. **Boot from USB**:  
   Insert the USB drive into your server and boot from it. You may need to change the boot order in the BIOS/UEFI settings.

4. **Install Windows Server**:  
   - Select your language, time, and currency preferences.  
   - Select "Install Windows Server" and agree to everything being deleted.  
   - Choose the edition of Windows Server you want to install (Standard or Datacenter).  
   - Accept the license terms.  
   - Select the drive where you want to install Windows Server *(you may need to load a driver)*.

## Configure Windows Server

1. **Set Administrator Password**:  
   Enter a strong password for the built-in Administrator account.

2. **Set Timezone**:  
   Change the timezone to match your location.

3. **Assign a Static IP Address**:  
   - Assign a static IP address for your Domain Controller.  
   - Optionally, configure the DNS servers your Domain Controller will resolve to.

4. **Rename the Server**:  
   Change the name of your server to conform to a standard naming convention *(e.g., ORG-DC1)*.

5. **Install Drivers**:  
   Ensure all necessary drivers are installed, especially if you are using a virtual machine.

6. **Run Windows Updates**:  
   Install all available updates to get the latest security patches for the operating system.

## Resources

  - Windows Server 2025 Evaluation: <https://www.microsoft.com/en-us/evalcenter/download-windows-server-2025>
  - Windows Server 2022 Evaluation: <https://www.microsoft.com/en-us/evalcenter/download-windows-server-2022>
  - Windows Server 2019 Evaluation: <https://www.microsoft.com/en-us/evalcenter/download-windows-server-2019>