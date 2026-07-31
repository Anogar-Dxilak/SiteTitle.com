import React, { useState, useRef, useEffect } from 'react';
import CyberAttackBg from './components/CyberAttackBg';
import FeedbackSection from './components/FeedbackSection';
import { TRANSLATIONS } from './translations';

// Home dizini yolu
const HOME_DIR = '/home/egemen';

// Dynamic Sanal Dosya Sistemi (Mock Filesystem) - Gerçekçi Linux yapısı
const getVirtualFs = (lang) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const isEn = lang === 'en';

  return {
    type: 'dir',
    permissions: 'drwxr-xr-x',
    links: 3,
    owner: 'root',
    group: 'root',
    size: 4096,
    date: 'Jul 10 09:00',
    children: {
      'home': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 3,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        children: {
          'egemen': {
            type: 'dir',
            permissions: 'drwxr-xr-x',
            links: 14,
            owner: 'egemen',
            group: 'egemen',
            size: 4096,
            date: 'Jul 17 17:48',
            children: {
              '.bashrc': {
                type: 'file',
                permissions: '-rw-r--r--',
                links: 1,
                owner: 'egemen',
                group: 'egemen',
                size: 3771,
                date: 'Jul 10 09:00',
                content: `# ~/.bashrc: executed by bash(1) for non-login shells.\n\n# If not running interactively, don't do anything\ncase $- in\n    *i*) ;;\n      *) return;;\nesac\n\n# History settings\nHISTSIZE=1000\nHISTFILESIZE=2000\n\n# Prompt\nPS1='\\[\\033[01;32m\\]guest@egemen\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '\n\n# Aliases\nalias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\nalias nmap-quick='nmap -sV -sC -O'\nalias msfconsole='cd /opt/metasploit && ./msfconsole'\n\nexport PATH=$PATH:/opt/metasploit:/opt/burpsuite`
              },
              '.bash_history': {
                type: 'file',
                permissions: '-rw-------',
                links: 1,
                owner: 'egemen',
                group: 'egemen',
                size: 892,
                date: 'Jul 17 16:30',
                content: 'nmap -sV -sC 192.168.1.0/24\nsudo wazuh-manager status\ncat /var/log/auth.log | grep "Failed password"\nmsfconsole\nsearchsploit apache 2.4\nsudo tcpdump -i eth0 -w capture.pcap\nwireshark capture.pcap\nsudo systemctl restart splunk\ncurl -k https://target.local/login\nsqlmap -u "http://target.local/page?id=1" --dbs\nnmap -sS -p- 10.10.10.5\nhydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.50\njohn --wordlist=/usr/share/wordlists/rockyou.txt hash.txt\nhashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt\ngobuster dir -u http://target.local -w /usr/share/wordlists/dirb/common.txt'
              },
              '.ssh': {
                type: 'dir',
                permissions: 'drwx------',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 15 11:20',
                children: {
                  'id_rsa.pub': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 570,
                    date: 'Jul 15 11:20',
                    content: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7... (truncated for security) guest@egemen'
                  },
                  'known_hosts': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 1244,
                    date: 'Jul 17 10:05',
                    content: '192.168.1.1 ecdsa-sha2-nistp256 AAAAE2VjZH...\n10.10.10.5 ssh-rsa AAAAB3NzaC1yc2EAAAA...\ngithub.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...'
                  }
                }
              },
              'Desktop': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 17 14:30',
                children: {
                  'quick_scan.sh': {
                    type: 'file',
                    permissions: '-rwxr-xr-x',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 485,
                    date: 'Jul 16 22:10',
                    content: '#!/bin/bash\n# Quick Network Reconnaissance Script\n# Author: Egemen Der\n\necho "[*] Starting Quick Scan..."\necho "[*] Target: $1"\n\necho "\\n[+] Port Scan:"\nnmap -sV -sC -T4 $1\n\necho "\\n[+] Directory Brute Force:"\ngobuster dir -u http://$1 -w /usr/share/wordlists/dirb/common.txt -q\n\necho "\\n[+] Nikto Scan:"\nnikto -h $1\n\necho "\\n[*] Scan Complete!"'
                  },
                  'notes.txt': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 312,
                    date: 'Jul 17 14:30',
                    content: isEn
                      ? '=== TODO ===\n- [ ] HTB: Complete Devvortex machine\n- [ ] Medium article: Write SSTI breakdown\n- [ ] Write custom Wazuh rule (SQL injection detection)\n- [ ] Complete pfSense VPN configuration\n- [x] Submit ION internship report\n- [x] Take Cisco CyberOps exam'
                      : '=== TODO ===\n- [ ] HTB: Devvortex makinesini bitir\n- [ ] Medium makale: SSTI yaz\n- [ ] Wazuh custom rule yaz (SQL injection detection)\n- [ ] pfSense VPN konfigürasyonu tamamla\n- [x] ION staj raporu gönder\n- [x] Cisco CyberOps sınavına gir'
                  },
                  'secret_flag.txt': {
                    type: 'file',
                    permissions: '-r--------',
                    links: 1,
                    owner: 'root',
                    group: 'root',
                    size: 48,
                    date: 'Jan  1 00:00',
                    content: isEn
                      ? '🏴 FLAG{cYbEr_sEcUrItY_nInJa_2026}\n\nCongratulations! You found the hidden flag. 🎉'
                      : '🏴 FLAG{cYbEr_sEcUrItY_nInJa_2026}\n\nTebrikler! Gizli bayrağı buldun. 🎉'
                  }
                }
              },
              'Documents': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 4,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 17 12:00',
                children: {
                  'reports': {
                    type: 'dir',
                    permissions: 'drwxr-xr-x',
                    links: 2,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 4096,
                    date: 'Jul 15 09:30',
                    children: {
                      'ion_staj_raporu.md': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 2048,
                        date: 'Jul 15 09:30',
                        content: `# ${t.experience.items[0].company}\n\n${t.experience.items[0].company} (${t.experience.items[0].date})\n${isEn ? 'Role' : 'Rol'}: ${t.experience.items[0].role}\n\n## ${isEn ? 'Key Responsibilities' : 'Yapılan Çalışmalar'}:\n${t.experience.items[0].bullets.map(b => `- ${b}`).join('\n')}`
                      },
                      'bgtek_staj_raporu.md': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 2560,
                        date: 'Jun 20 14:00',
                        content: `# ${t.experience.items[1].company}\n\n${t.experience.items[1].company} (${t.experience.items[1].date})\n${isEn ? 'Role' : 'Rol'}: ${t.experience.items[1].role}\n\n## ${isEn ? 'Key Responsibilities' : 'Yapılan Çalışmalar'}:\n${t.experience.items[1].bullets.map(b => `- ${b}`).join('\n')}`
                      },
                      'pentest_diwa_report.md': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 1890,
                        date: 'May 28 16:45',
                        content: '# DIWA Penetration Test Report\n\n## Executive Summary\nDuring penetration testing of the DIWA system, a critical SQL injection\nvulnerability was discovered in the admin authentication mechanism.\n\n## Findings\n\n### CRITICAL - Admin NoPass SQL Injection\n- Severity: Critical (CVSS 9.8)\n- Location: /admin/login.php\n- Parameter: username\n- Payload: \' OR 1=1 --\n- Impact: Full admin access without credentials\n\n### Remediation\n- Implement parameterized queries\n- Input validation and sanitization\n- WAF rule implementation'
                      }
                    }
                  },
                  'certifications': {
                    type: 'dir',
                    permissions: 'drwxr-xr-x',
                    links: 2,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 4096,
                    date: 'Jul 10 11:00',
                    children: {
                      'sertifikalar.txt': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 980,
                        date: 'Jul 10 11:00',
                        content: `${isEn ? 'Certifications & Verification Links' : 'Sertifikalar ve Doğrulama Linkleri'}:\n${t.education.certifications.map(c => `✓ ${c.name}\n  └─ ${c.link}`).join('\n\n')}`
                      }
                    }
                  },
                  'cv_egemen_der.md': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 3200,
                    date: 'Jul 17 12:00',
                    content: `# ${t.about.name} - CV\n\n## ${isEn ? 'Personal Info' : 'Kişisel Bilgiler'}\nEmail:  ${t.about.contactValues.email || 'egemender@hotmail.com'}\nPhone:  +90 552 825 26 10\nLocation:    ${t.about.contactValues.location}\nLinkedIn: https://linkedin.com/in/egemen-der\nMedium:   https://medium.com/@egemender\nMilitary: ${t.about.contactValues.military}\nLanguages:   ${t.about.contactValues.languages}\n\n## ${isEn ? 'About Me' : 'Hakkımda'}\n${t.about.intro}\n\n## ${isEn ? 'Education' : 'Eğitim'}\n${t.education.school} - ${t.education.degree} (${t.education.date})\n${t.education.focusLabel} ${t.education.focus}\n${t.education.activities}\n${t.education.activities2}`
                  }
                }
              },
              'Downloads': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 17 09:15',
                children: {
                  'rockyou.txt': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 139921497,
                    date: 'Mar 12 08:00',
                    content: isEn
                      ? '(!) File too large. Showing first 10 lines:\n\n123456\npassword\n12345678\nqwerty\n123456789\n12345\n1234\n111111\n1234567\ndragon'
                      : '(!) Bu dosya çok büyük. İlk 10 satır gösteriliyor:\n\n123456\npassword\n12345678\nqwerty\n123456789\n12345\n1234\n111111\n1234567\ndragon'
                  },
                  'linpeas.sh': {
                    type: 'file',
                    permissions: '-rwxr-xr-x',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 827340,
                    date: 'Jul 05 20:30',
                    content: '#!/bin/bash\n# linPEAS - Linux Privilege Escalation Awesome Script\n# Version: 4.0\n# Author: carlospolop\n# https://github.com/carlospolop/PEASS-ng\n\n# (Truncated - Full script available at GitHub)'
                  },
                  'nmap_cheatsheet.pdf': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 245760,
                    date: 'Jun 18 13:20',
                    content: isEn
                      ? '[PDF File - Nmap Cheat Sheet]\n\nBasic Scan:\n  nmap -sV <target>          # Version detection\n  nmap -sC <target>          # Default script scan\n  nmap -O <target>           # OS detection\n  nmap -A <target>           # Aggressive scan\n  nmap -sS -p- <target>      # All ports SYN scan\n  nmap -sU <target>          # UDP scan\n\nNSE Scripts:\n  nmap --script vuln <target>\n  nmap --script=http-enum <target>\n  nmap --script=smb-vuln* <target>'
                      : '[PDF Dosyası - Nmap Cheat Sheet]\n\nTemel Tarama:\n  nmap -sV <target>          # Versiyon tespiti\n  nmap -sC <target>          # Script taraması\n  nmap -O <target>           # OS tespiti\n  nmap -A <target>           # Agresif tarama\n  nmap -sS -p- <target>      # Tüm portlar SYN\n  nmap -sU <target>          # UDP tarama\n\nNSE Scriptleri:\n  nmap --script vuln <target>\n  nmap --script=http-enum <target>\n  nmap --script=smb-vuln* <target>'
                  }
                }
              },
              'Music': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul  8 19:00',
                children: {
                  'hacking_playlist.m3u': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 256,
                    date: 'Jul  8 19:00',
                    content: '#EXTM3U\n#EXTINF:240, Darknet Diaries - EP 131\n#EXTINF:180, Cyberpunk 2077 OST - Rebel Path\n#EXTINF:210, The Algorithm - Floating Point\n#EXTINF:195, Perturbator - Dangerous Days\n#EXTINF:230, Carpenter Brut - Turbo Killer'
                  }
                }
              },
              'Pictures': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 12 15:00',
                children: {
                  'screenshots': {
                    type: 'dir',
                    permissions: 'drwxr-xr-x',
                    links: 2,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 4096,
                    date: 'Jul 12 15:00',
                    children: {
                      'wazuh_dashboard.png': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 524288,
                        date: 'Jul 12 15:00',
                        content: '[PNG File - Wazuh SIEM Dashboard Screenshot]\nResolution: 1920x1080\nWazuh Manager v4.7 - Security Events Overview'
                      },
                      'htb_pwned.png': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 348160,
                        date: 'Jul  8 23:45',
                        content: '[PNG File - HackTheBox Machine Pwned]\nResolution: 1920x1080\n🏆 Machine: Devvortex | Difficulty: Easy | Status: PWNED!'
                      }
                    }
                  }
                }
              },
              'Public': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 10 09:00',
                children: {}
              },
              'Templates': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 10 09:00',
                children: {}
              },
              'Videos': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 10 09:00',
                children: {}
              },
              'projects': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 16 10:00',
                children: {
                  'sefer_otomasyon': {
                    type: 'dir',
                    permissions: 'drwxr-xr-x',
                    links: 3,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 4096,
                    date: 'Jul 14 18:00',
                    children: {
                      'README.md': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 420,
                        date: 'Jul 14 18:00',
                        content: `# ${t.projects.projectsList[0].title}\n\nTech Stack: ${t.projects.projectsList[0].tech}\n\n## ${isEn ? 'Description' : 'Açıklama'}\n${t.projects.projectsList[0].desc}\n\n## GitHub\n${t.projects.projectsList[0].link}`
                      }
                    }
                  },
                  'cv_olusturma': {
                    type: 'dir',
                    permissions: 'drwxr-xr-x',
                    links: 3,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 4096,
                    date: 'Jul 12 11:00',
                    children: {
                      'README.md': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 380,
                        date: 'Jul 12 11:00',
                        content: `# ${t.projects.projectsList[1].title}\n\nTech Stack: ${t.projects.projectsList[1].tech}\n\n## ${isEn ? 'Description' : 'Açıklama'}\n${t.projects.projectsList[1].desc}\n\n## GitHub\n${t.projects.projectsList[1].link}`
                      }
                    }
                  },
                  'tir_otomasyonu': {
                    type: 'dir',
                    permissions: 'drwxr-xr-x',
                    links: 3,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 4096,
                    date: 'Jul 10 16:30',
                    children: {
                      'README.md': {
                        type: 'file',
                        permissions: '-rw-r--r--',
                        links: 1,
                        owner: 'egemen',
                        group: 'egemen',
                        size: 400,
                        date: 'Jul 10 16:30',
                        content: `# ${t.projects.projectsList[2].title}\n\nTech Stack: ${t.projects.projectsList[2].tech}\n\n## ${isEn ? 'Description' : 'Açıklama'}\n${t.projects.projectsList[2].desc}\n\n## GitHub\n${t.projects.projectsList[2].link}`
                      }
                    }
                  }
                }
              },
              'tools': {
                type: 'dir',
                permissions: 'drwxr-xr-x',
                links: 2,
                owner: 'egemen',
                group: 'egemen',
                size: 4096,
                date: 'Jul 16 21:00',
                children: {
                  'recon.sh': {
                    type: 'file',
                    permissions: '-rwxr-xr-x',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 720,
                    date: 'Jul 16 21:00',
                    content: '#!/bin/bash\n# Automated Reconnaissance Script\n# Author: Egemen Der\n\nif [ -z "$1" ]; then\n  echo "Usage: ./recon.sh <target>"\n  exit 1\nfi\n\nTARGET=$1\nOUTDIR="./recon_$TARGET"\nmkdir -p $OUTDIR\n\necho "[*] Starting recon on $TARGET"\necho "[+] Subdomain enumeration..."\nsubfinder -d $TARGET -o $OUTDIR/subdomains.txt\n\necho "[+] Port scanning..."\nnmap -sV -sC -oN $OUTDIR/nmap.txt $TARGET\n\necho "[+] Directory brute-force..."\ngobuster dir -u http://$TARGET -w /usr/share/wordlists/dirb/common.txt -o $OUTDIR/dirs.txt\n\necho "[*] Results saved to $OUTDIR/"'
                  },
                  'wazuh_rules.xml': {
                    type: 'file',
                    permissions: '-rw-r--r--',
                    links: 1,
                    owner: 'egemen',
                    group: 'egemen',
                    size: 1580,
                    date: 'Jul 14 08:30',
                    content: '<!-- Custom Wazuh Rules by Egemen Der -->\n<group name="custom_sql_injection">\n  <rule id="100100" level="12">\n    <if_group>web|accesslog</if_group>\n    <regex>SELECT.*FROM|UNION.*SELECT|OR\\s+1=1|DROP\\s+TABLE</regex>\n    <description>SQL Injection attempt detected</description>\n    <mitre>\n      <id>T1190</id>\n    </mitre>\n  </rule>\n\n  <rule id="100101" level="10">\n    <if_group>web|accesslog</if_group>\n    <regex>\\.\\.%2f|\\.\\.\\\\|%00|/etc/passwd</regex>\n    <description>Path traversal attempt detected</description>\n    <mitre>\n      <id>T1083</id>\n    </mitre>\n  </rule>\n</group>'
                  }
                }
              }
            }
          }
        }
      },
      'etc': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        children: {
          'hostname': {
            type: 'file',
            permissions: '-rw-r--r--',
            links: 1,
            owner: 'root',
            group: 'root',
            size: 8,
            date: 'Jul 10 09:00',
            content: 'egemen'
          },
          'os-release': {
            type: 'file',
            permissions: '-rw-r--r--',
            links: 1,
            owner: 'root',
            group: 'root',
            size: 310,
            date: 'Jul 10 09:00',
            content: 'NAME="CyberOS"\nVERSION="1.0.0 (Red Team Edition)"\nID=cyberos\nPRETTY_NAME="CyberOS 1.0.0 Red Team Edition"\nHOME_URL="https://egemender.dev"\nSUPPORT_URL="https://linkedin.com/in/egemen-der"'
          },
          'passwd': {
            type: 'file',
            permissions: '-rw-r--r--',
            links: 1,
            owner: 'root',
            group: 'root',
            size: 180,
            date: 'Jul 10 09:00',
            content: 'root:x:0:0:root:/root:/bin/bash\negemen:x:1000:1000:Egemen Der:/home/egemen:/bin/bash\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin'
          }
        }
      },
      'var': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        children: {
          'log': {
            type: 'dir',
            permissions: 'drwxr-xr-x',
            links: 2,
            owner: 'root',
            group: 'root',
            size: 4096,
            date: 'Jul 17 17:48',
            children: {
              'auth.log': {
                type: 'file',
                permissions: '-rw-r-----',
                links: 1,
                owner: 'root',
                group: 'adm',
                size: 4820,
                date: 'Jul 17 17:48',
                content: 'Jul 17 17:30:01 redteam sshd[4521]: Failed password for root from 185.220.101.34 port 42871 ssh2\nJul 17 17:30:03 redteam sshd[4521]: Failed password for root from 185.220.101.34 port 42871 ssh2\nJul 17 17:30:05 redteam sshd[4523]: Accepted publickey for egemen from 192.168.1.10 port 52340 ssh2\nJul 17 17:31:22 redteam sudo: egemen : TTY=pts/0 ; PWD=/home/egemen ; USER=root ; COMMAND=/usr/bin/apt update\nJul 17 17:45:10 redteam sshd[4890]: Failed password for invalid user admin from 103.45.67.89 port 38291 ssh2\nJul 17 17:45:12 redteam sshd[4891]: Failed password for invalid user test from 103.45.67.89 port 38295 ssh2\nJul 17 17:48:00 redteam CRON[5012]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)'
              }
            }
          }
        }
      },
      'bin': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        restricted: true,
        children: {}
      },
      'boot': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        restricted: true,
        children: {}
      },
      'root': {
        type: 'dir',
        permissions: 'drwx------',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        restricted: true,
        children: {}
      },
      'usr': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        restricted: true,
        children: {}
      },
      'obt': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        restricted: false,
        children: {
          'readme.txt': {
            type: 'file',
            permissions: '-rw-r--r--',
            links: 1,
            owner: 'guest',
            group: 'staff',
            size: 140,
            date: 'Jul 10 09:00',
            content: isEn
              ? 'Directory for accessible optional modules and software (obt).'
              : 'Erişilebilir opsiyonel modüller ve yazılımlar dizini (obt).'
          }
        }
      },
      'opt': {
        type: 'dir',
        permissions: 'drwxr-xr-x',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 10 09:00',
        restricted: false,
        children: {
          'readme.txt': {
            type: 'file',
            permissions: '-rw-r--r--',
            links: 1,
            owner: 'guest',
            group: 'staff',
            size: 140,
            date: 'Jul 10 09:00',
            content: isEn
              ? 'Directory for accessible optional modules and software (opt).'
              : 'Erişilebilir opsiyonel modüller ve yazılımlar dizini (opt).'
          }
        }
      },
      'tmp': {
        type: 'dir',
        permissions: 'drwxrwxrwt',
        links: 2,
        owner: 'root',
        group: 'root',
        size: 4096,
        date: 'Jul 17 17:48',
        restricted: false,
        children: {}
      }
    }
  };
};

// Dosya Sistemi Konum Bulma Yardımcısı (Paths & Traversing)
const getFsItem = (path, currentPath, lang = 'tr') => {
  let targetPath = (path !== undefined && path !== null) ? path.trim() : '.';
  if (targetPath === '') targetPath = '.';

  if (targetPath.startsWith('~')) {
    targetPath = targetPath.replace('~', HOME_DIR);
    if (targetPath === '') targetPath = HOME_DIR;
  }

  let absoluteParts = [];
  if (targetPath.startsWith('/')) {
    absoluteParts = targetPath.split('/');
  } else {
    const currentParts = currentPath.split('/').filter(Boolean);
    const relativeParts = targetPath.split('/');
    absoluteParts = ['', ...currentParts, ...relativeParts];
  }

  const resolvedParts = [];
  for (const part of absoluteParts) {
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      resolvedParts.pop();
      continue;
    }
    resolvedParts.push(part);
  }

  const virtualFs = getVirtualFs(lang);
  let currentNode = virtualFs;
  const actualResolvedParts = [];
  for (const part of resolvedParts) {
    if (currentNode && currentNode.type === 'dir' && currentNode.children) {
      let matchKey = Object.keys(currentNode.children).find(key => key === part);
      if (!matchKey) {
        matchKey = Object.keys(currentNode.children).find(key => key.toLowerCase() === part.toLowerCase());
      }
      if (matchKey) {
        currentNode = currentNode.children[matchKey];
        actualResolvedParts.push(matchKey);
      } else {
        return { node: null, resolvedPath: '/' + resolvedParts.join('/') };
      }
    } else {
      return { node: null, resolvedPath: '/' + resolvedParts.join('/') };
    }
  }
  return { node: currentNode, resolvedPath: '/' + actualResolvedParts.join('/') };
};

// Linkleri (URL) saptayıp tıklanabilir kılan fonksiyon
const renderTerminalText = (text) => {
  const urlRegex = /(https?:\/\/[^\s\)]+)/g;
  const parts = text.split(urlRegex);
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-[#00ff66] underline hover:text-[#00ff66]/80 break-all">
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function App() {
  // Dil Durumu (Language State) - localStorage ile kalıcı
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('site_lang') || 'tr';
  });

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('site_lang', newLang);
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  // Terminal için state yapıları
  const [terminalInput, setTerminalInput] = useState('');
  const [currentPath, setCurrentPath] = useState(HOME_DIR);
  const [terminalHistory, setTerminalHistory] = useState([
    { text: t.terminal.welcome, type: 'system' },
    { text: t.terminal.helpInstruction, type: 'system' },
    { text: '', type: 'system' }
  ]);
  const terminalBodyRef = useRef(null);

  // Language switch effect on terminal welcome if empty history
  useEffect(() => {
    setTerminalHistory(prev => {
      if (prev.length <= 3) {
        return [
          { text: t.terminal.welcome, type: 'system' },
          { text: t.terminal.helpInstruction, type: 'system' },
          { text: '', type: 'system' }
        ];
      }
      return prev;
    });
  }, [lang]);

  // Terminale yeni yazı geldikçe sadece terminal kutusunu aşağı kaydır
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Terminal Komut İşleyici
  const handleCommand = (e) => {
    e.preventDefault();
    const inputClean = terminalInput.trim();
    if (!inputClean) return;

    const parts = inputClean.split(/\s+/);
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let response = [];
    switch (baseCmd) {
      case 'help':
        response = [
          { text: t.terminal.commandsHeader, type: 'output' },
          { text: t.terminal.aboutCmd, type: 'output' },
          { text: t.terminal.skillsCmd, type: 'output' },
          { text: t.terminal.experienceCmd, type: 'output' },
          { text: t.terminal.educationCmd, type: 'output' },
          { text: t.terminal.contactCmd, type: 'output' },
          { text: t.terminal.lsCmd, type: 'output' },
          { text: t.terminal.cdCmd, type: 'output' },
          { text: t.terminal.catCmd, type: 'output' },
          { text: t.terminal.pwdCmd, type: 'output' },
          { text: t.terminal.clearCmd, type: 'output' }
        ];
        break;
      case 'about':
        response = [
          { text: `${t.about.name} - ${t.about.title}`, type: 'output' },
          { text: '', type: 'output' },
          { text: t.about.intro, type: 'output' }
        ];
        break;
      case 'skills':
        response = [
          { text: `${t.skills.sectionTitle.toUpperCase()}:`, type: 'output' },
          ...t.skills.categories.map(cat => ({ text: `  [+] ${cat.name}: ${cat.skills.join(', ')}`, type: 'output' }))
        ];
        break;
      case 'experience':
        response = [
          { text: `${t.experience.sectionTitle.toUpperCase()}:`, type: 'output' },
          ...t.experience.items.flatMap(exp => [
            { text: `  * ${exp.company} (${exp.date})`, type: 'output' },
            { text: `    ${lang === 'en' ? 'Role' : 'Pozisyon'}: ${exp.role}`, type: 'output' },
            ...exp.bullets.map(b => ({ text: `    - ${b}`, type: 'output' })),
            { text: '', type: 'output' }
          ])
        ];
        break;
      case 'education':
        response = [
          { text: `${t.education.sectionTitle.toUpperCase()}:`, type: 'output' },
          { text: `  ${lang === 'en' ? 'School' : 'Okul'}:           ${t.education.school}`, type: 'output' },
          { text: `  ${lang === 'en' ? 'Degree' : 'Bölüm'}:          ${t.education.degree} (${t.education.date})`, type: 'output' },
          { text: `  ${lang === 'en' ? 'Club' : 'Kulüp'}:          ${t.education.activities}`, type: 'output' },
          { text: `  ${t.education.focusLabel}       ${t.education.focus}`, type: 'output' },
          { text: `  ${t.education.certificationsHeader}`, type: 'output' },
          ...t.education.certifications.map(cert => ({ text: `    - ${cert.name} (${cert.link})`, type: 'output' }))
        ];
        break;
      case 'contact':
        response = [
          { text: `${lang === 'en' ? 'CONTACT INFO' : 'İLETİŞİM BİLGİLERİ'}:`, type: 'output' },
          { text: `  Email:       egemender@hotmail.com`, type: 'output' },
          { text: `  Phone:       +90 552 825 26 10`, type: 'output' },
          { text: `  Location:    ${t.about.contactValues.location}`, type: 'output' },
          { text: `  LinkedIn:    https://linkedin.com/in/egemen-der`, type: 'output' },
          { text: `  Medium:      https://medium.com/@egemender`, type: 'output' },
          { text: `  Military:    ${t.about.contactValues.military}`, type: 'output' },
          { text: `  Languages:   ${t.about.contactValues.languages}`, type: 'output' }
        ];
        break;
      case 'pwd':
        response = [{ text: currentPath, type: 'output' }];
        break;
      case 'cd': {
        const target = args[0] || '~';
        const { node, resolvedPath } = getFsItem(target, currentPath, lang);
        if (!node) {
          response = [{ text: `-bash: cd: ${target}: No such file or directory`, type: 'error' }];
        } else if (node.restricted) {
          response = [{ text: `-bash: cd: ${target}: Permission denied`, type: 'error' }];
        } else if (node.type !== 'dir') {
          response = [{ text: `-bash: cd: ${target}: Not a directory`, type: 'error' }];
        } else {
          setCurrentPath(resolvedPath);
          response = [];
        }
        break;
      }
      case 'cat': {
        if (args.length === 0) {
          response = [{ text: 'cat: missing operand', type: 'error' }];
        } else {
          const fileResponse = [];
          for (const target of args) {
            const { node } = getFsItem(target, currentPath, lang);
            if (!node) {
              fileResponse.push({ text: `cat: ${target}: No such file or directory`, type: 'error' });
            } else if (node.restricted) {
              fileResponse.push({ text: `cat: ${target}: Permission denied`, type: 'error' });
            } else if (node.type === 'dir') {
              fileResponse.push({ text: `cat: ${target}: Is a directory`, type: 'error' });
            } else {
              const lines = node.content.split('\n');
              fileResponse.push(...lines.map(line => ({ text: line, type: 'output' })));
            }
          }
          response = fileResponse;
        }
        break;
      }
      case 'ls': {
        let showHidden = false;
        let longFormat = false;
        let targets = [];

        for (const arg of args) {
          if (arg.startsWith('-')) {
            if (arg.includes('a')) showHidden = true;
            if (arg.includes('l')) longFormat = true;
          } else {
            targets.push(arg);
          }
        }

        const targetPath = targets[0] || '.';
        const { node } = getFsItem(targetPath, currentPath, lang);

        if (!node) {
          response = [{ text: `ls: cannot access '${targetPath}': No such file or directory`, type: 'error' }];
        } else if (node.restricted) {
          response = [{ text: `ls: cannot open directory '${targetPath}': Permission denied`, type: 'error' }];
        } else if (node.type === 'file') {
          if (longFormat) {
            response = [{
              type: 'rich',
              elements: [
                { text: node.permissions + ' ', className: 'text-gray-500 font-mono' },
                { text: ` ${node.links} ${node.owner} ${node.group} `, className: 'text-gray-400 font-mono' },
                { text: String(node.size).padStart(5) + ' ', className: 'text-yellow-500/80 font-mono' },
                { text: node.date + ' ', className: 'text-gray-500 font-mono' },
                { text: targetPath, className: node.permissions.includes('x') ? 'text-green-400 font-mono font-bold' : 'text-gray-200 font-mono' }
              ]
            }];
          } else {
            response = [{ text: targetPath, type: node.permissions.includes('x') ? 'exe' : 'file' }];
          }
        } else {
          let items = Object.entries(node.children || {});
          items.sort((a, b) => a[0].localeCompare(b[0]));

          if (showHidden) {
            const { node: parentNode } = getFsItem('..', targetPath === '.' ? currentPath : targetPath, lang);
            const dotDotNode = parentNode || node;
            items = [
              ['.', node],
              ['..', dotDotNode],
              ...items
            ];
          } else {
            items = items.filter(([name]) => !name.startsWith('.'));
          }

          if (longFormat) {
            response = items.map(([name, item]) => {
              const isDir = item.type === 'dir';
              const isExe = !isDir && item.permissions.includes('x');
              let nameColor = 'text-gray-200';
              if (name === 'tmp') nameColor = 'bg-[#1e4a45] text-cyan-300 font-bold px-1 rounded-sm';
              else if (isDir) nameColor = 'text-cyan-400 font-bold';
              else if (isExe) nameColor = 'text-[#00ff66] font-bold';

              return {
                type: 'rich',
                elements: [
                  { text: item.permissions + ' ', className: 'text-gray-500 font-mono' },
                  { text: ` ${String(item.links).padStart(2)} ${item.owner.padEnd(5)} ${item.group.padEnd(5)} `, className: 'text-gray-400 font-mono' },
                  { text: String(item.size).padStart(5) + ' ', className: 'text-yellow-500/80 font-mono' },
                  { text: item.date + ' ', className: 'text-gray-500 font-mono' },
                  { text: name + (isDir ? '/' : ''), className: `${nameColor} font-mono` }
                ]
              };
            });
          } else {
            const elements = [];
            items.forEach(([name, item], idx) => {
              const isDir = item.type === 'dir';
              const isExe = !isDir && item.permissions.includes('x');
              let nameColor = 'text-gray-200';
              if (name === 'tmp') nameColor = 'bg-[#1e4a45] text-cyan-300 font-bold px-1 rounded-sm';
              else if (isDir) nameColor = 'text-cyan-400 font-bold';
              else if (isExe) nameColor = 'text-[#00ff66] font-bold';

              elements.push({
                text: name + (isDir ? '/' : ''),
                className: `${nameColor} font-mono hover:underline`
              });
              
              if (idx < items.length - 1) {
                elements.push({ text: '   ', className: 'text-gray-400 font-mono' });
              }
            });
            response = [{ type: 'rich', elements }];
          }
        }
        break;
      }
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      default:
        response = [{ text: `${t.terminal.notFound} "${baseCmd}". ${t.terminal.helpInstruction}`, type: 'error' }];
    }

    const displayPath = currentPath === HOME_DIR ? '~' : (currentPath.startsWith(HOME_DIR + '/') ? '~' + currentPath.slice(HOME_DIR.length) : currentPath);
    setTerminalHistory(prev => [
      ...prev,
      { type: 'kali-prompt', path: displayPath, command: terminalInput },
      ...response,
      { text: '', type: 'system' }
    ]);
    setTerminalInput('');
  };

  // Tab ile otomatik tamamlama
  const AVAILABLE_COMMANDS = ['help', 'about', 'skills', 'experience', 'education', 'contact', 'ls', 'cd', 'cat', 'pwd', 'clear'];

  const handleTabComplete = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();

    const input = terminalInput;
    if (!input || !input.trim()) return;

    const parts = input.split(/\s+/);
    const isFirstWord = parts.length <= 1;
    const partial = parts[parts.length - 1] || '';

    if (isFirstWord) {
      const matches = AVAILABLE_COMMANDS.filter(cmd => cmd.startsWith(partial.toLowerCase()));
      if (matches.length === 1) {
        setTerminalInput(matches[0] + ' ');
      } else if (matches.length > 1) {
        let commonPrefix = matches[0];
        for (const m of matches) {
          while (!m.startsWith(commonPrefix)) {
            commonPrefix = commonPrefix.slice(0, -1);
          }
        }
        if (commonPrefix.length > partial.length) {
          setTerminalInput(commonPrefix);
        } else {
          const displayPath = currentPath === HOME_DIR ? '~' : (currentPath.startsWith(HOME_DIR + '/') ? '~' + currentPath.slice(HOME_DIR.length) : currentPath);
          setTerminalHistory(prev => [
            ...prev,
            { type: 'kali-prompt', path: displayPath, command: input },
            { type: 'rich', elements: matches.map((m, i) => ({
              text: m + (i < matches.length - 1 ? '   ' : ''),
              className: 'text-cyan-400 font-mono'
            }))}
          ]);
        }
      }
    } else {
      const prefix = parts.slice(0, -1).join(' ') + ' ';
      let dirPath = '.';
      let filePartial = partial;

      const lastSlash = partial.lastIndexOf('/');
      if (lastSlash !== -1) {
        dirPath = partial.slice(0, lastSlash) || '/';
        filePartial = partial.slice(lastSlash + 1);
      }

      const { node } = getFsItem(dirPath, currentPath, lang);
      if (!node || node.type !== 'dir' || !node.children) return;

      const candidates = Object.entries(node.children)
        .filter(([name]) => name.toLowerCase().startsWith(filePartial.toLowerCase()))
        .filter(([name]) => !name.startsWith('.') || filePartial.startsWith('.'));

      if (candidates.length === 0) return;

      const buildCompletion = (name, item) => {
        const pathPrefix = lastSlash !== -1 ? partial.slice(0, lastSlash + 1) : '';
        return pathPrefix + name + (item.type === 'dir' ? '/' : '');
      };

      if (candidates.length === 1) {
        const [name, item] = candidates[0];
        const completed = buildCompletion(name, item);
        setTerminalInput(prefix + completed + (item.type === 'file' ? ' ' : ''));
      } else {
        let commonName = candidates[0][0];
        for (const [name] of candidates) {
          while (commonName.length > 0 && !name.toLowerCase().startsWith(commonName.toLowerCase())) {
            commonName = commonName.slice(0, -1);
          }
        }
        if (commonName.length > filePartial.length) {
          const pathPrefix = lastSlash !== -1 ? partial.slice(0, lastSlash + 1) : '';
          setTerminalInput(prefix + pathPrefix + commonName);
        } else {
          const displayPath = currentPath === HOME_DIR ? '~' : (currentPath.startsWith(HOME_DIR + '/') ? '~' + currentPath.slice(HOME_DIR.length) : currentPath);
          setTerminalHistory(prev => [
            ...prev,
            { type: 'kali-prompt', path: displayPath, command: input },
            { type: 'rich', elements: candidates.map(([name, item], i) => ({
              text: name + (item.type === 'dir' ? '/' : '') + (i < candidates.length - 1 ? '   ' : ''),
              className: item.type === 'dir' ? 'text-cyan-400 font-bold font-mono' : 'text-gray-200 font-mono'
            }))}
          ]);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-[#00ff66] selection:text-black">
      
      {/* HEADER WITH MULTI-LANGUAGE SWITCHER */}
      <header className="border-b border-gray-900 bg-[#0f0f0f]/85 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col items-center gap-2 sm:gap-2.5 overflow-hidden relative">
        <CyberAttackBg />
        <div className="relative z-10 flex items-center justify-between w-full max-w-7xl">
          <div className="hidden sm:block w-24"></div>
          <h1 className="font-mono font-bold text-base sm:text-xl tracking-wider text-center flex-1" style={{ color: '#ffffff' }}>
            {lang === 'en' ? 'EGEMEN DER PORTFOLIO' : 'EGEMEN DER PORTFOLYO'}
          </h1>

          {/* Language Switcher Badge */}
          <div className="flex items-center space-x-1 bg-black/80 border border-gray-800 p-1 rounded-xl font-mono text-xs shadow-inner">
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center space-x-1.5 ${
                lang === 'tr'
                  ? 'bg-[#00ff66]/20 border border-[#00ff66]/60 text-[#00ff66] font-bold shadow-[0_0_12px_rgba(0,255,102,0.35)]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
              title="Türkçe"
            >
              <span>🇹🇷</span>
              <span>TR</span>
            </button>
            <span className="text-gray-800">|</span>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center space-x-1.5 ${
                lang === 'en'
                  ? 'bg-[#00ff66]/20 border border-[#00ff66]/60 text-[#00ff66] font-bold shadow-[0_0_12px_rgba(0,255,102,0.35)]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
              title="English"
            >
              <span>🇬🇧</span>
              <span>EN</span>
            </button>
          </div>
        </div>

        <nav className="relative z-10 flex flex-wrap justify-center gap-x-3 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 font-mono text-[11px] sm:text-sm w-full">
          <a href="#about" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.about}</a>
          <a href="#skills" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.skills}</a>
          <a href="#experience" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.experience}</a>
          <a href="#education" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.education}</a>
          <a href="#projects" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.projects}</a>
          <a href="#references" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.references}</a>
          <a href="#feedback" className="text-gray-300 hover:text-[#00ff66] underline underline-offset-4 decoration-gray-700/80 hover:decoration-[#00ff66] transition">{t.nav.feedback}</a>
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL VE ORTA ALAN (2 Kolon Kaplar) */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* ABOUT / INTRO SECTION */}
          <section id="about" className="bg-[#0f0f0f] border border-gray-900 rounded-lg p-4 sm:p-6 space-y-6 scroll-mt-32">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profil Resmi Alanı */}
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-0.5 bg-[#00ff66] rounded-full blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>
                <div className="relative w-24 h-24 rounded-full bg-gray-955 border border-gray-800 flex items-center justify-center overflow-hidden">
                  <img src="/profil.jpg" alt="Egemen Der" className="w-full h-full object-cover" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-2xl font-bold tracking-wide" style={{ color: '#ffffff' }}>{t.about.name}</h2>
                <p className="text-sm font-mono" style={{ color: '#00ff66' }}>{t.about.title}</p>
                <p className="text-sm leading-relaxed text-gray-400 mt-3">{t.about.intro}</p>
              </div>
            </div>

            {/* İletişim Detayları Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-900 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{t.about.contactLabels.location}</span>
                <span className="text-gray-300">{t.about.contactValues.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{t.about.contactLabels.email}</span>
                <a href="mailto:egemender@hotmail.com" className="text-gray-300 hover:text-[#00ff66] transition">egemender@hotmail.com</a>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{t.about.contactLabels.phone}</span>
                <a href="tel:+905528252610" className="text-gray-300 hover:text-[#00ff66] transition">+90 552 825 26 10</a>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{t.about.contactLabels.military}</span>
                <span className="text-gray-300">{t.about.contactValues.military}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{t.about.contactLabels.languages}</span>
                <span className="text-gray-300">{t.about.contactValues.languages}</span>
              </div>
              <div className="flex items-center space-x-3 pt-1">
                <a href="https://linkedin.com/in/egemen-der" target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-900 border border-gray-800 text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66] px-2 py-1 rounded transition">LinkedIn</a>
                <a href="https://medium.com/@egemender" target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-900 border border-gray-800 text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66] px-2 py-1 rounded transition">Medium</a>
              </div>
            </div>
          </section>
          
          {/* SKILLS */}
          <section id="skills" className="space-y-6 scroll-mt-32">
            <h2 className="text-sm font-mono uppercase tracking-widest border-b border-gray-900 pb-2" style={{ color: '#00ff66' }}>{t.skills.sectionTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.skills.categories.map((cat, idx) => (
                <div key={idx} className="bg-[#0f0f0f]/40 border border-gray-900 rounded p-4 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: '#ffffff' }}>{cat.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.skills.map((skill, index) => (
                      <span key={index} className="bg-[#0f0f0f] border border-gray-800 text-gray-400 font-mono text-[11px] px-2.5 py-1 rounded hover:border-[#00ff66]/60 transition">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* EXPERIENCE */}
          <section id="experience" className="space-y-6 scroll-mt-32">
            <h2 className="text-sm font-mono uppercase tracking-widest border-b border-gray-900 pb-2" style={{ color: '#00ff66' }}>{t.experience.sectionTitle}</h2>
            <div className="space-y-6">
              {t.experience.items.map((exp, index) => (
                <div key={index} className="bg-[#0f0f0f] border border-gray-900 rounded-lg p-5 space-y-4 hover:border-gray-800 transition">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <h3 className="font-bold text-base" style={{ color: '#ffffff' }}>{exp.company}</h3>
                      <p className="text-sm text-[#00ff66] font-mono mt-0.5">{exp.role}</p>
                    </div>
                    <span className="text-xs font-mono bg-gray-950 text-gray-400 px-2.5 py-1 rounded border border-gray-800 self-start">{exp.date}</span>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-gray-400 list-inside list-disc pl-1 leading-relaxed">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="hover:text-gray-300 transition-colors">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* EDUCATION */}
          <section id="education" className="bg-[#0f0f0f] border border-gray-900 rounded-lg p-5 space-y-5 scroll-mt-32">
            <h2 className="text-sm font-mono uppercase tracking-widest border-b border-gray-955 pb-2" style={{ color: '#00ff66' }}>{t.education.sectionTitle}</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="font-bold text-base" style={{ color: '#ffffff' }}>{t.education.school}</h3>
                  <p className="text-sm text-gray-400 font-mono mt-0.5">{t.education.degree}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">{t.education.focusLabel} {t.education.focus}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">👥 {t.education.activities}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">👥 {t.education.activities2}</p>
                </div>
                <span className="text-xs font-mono bg-gray-950 text-gray-400 px-2.5 py-1 rounded border border-gray-800 self-start">{t.education.date}</span>
              </div>

              {/* Sertifikalar Grid */}
              <div className="pt-4 border-t border-gray-955 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: '#ffffff' }}>{t.education.certificationsHeader}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                  {t.education.certifications.map((cert, idx) => (
                    <a key={idx} href={cert.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-gray-955 border border-gray-900 px-3 py-2 rounded hover:border-[#00ff66]/30 transition group text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#00ff66] font-bold">✓</span>
                        <span className="text-gray-400 group-hover:text-white transition">{cert.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono group-hover:text-[#00ff66] transition">{t.education.verifyBtn}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PROJECTS & ARTICLES */}
          <section id="projects" className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-32">
            <div className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest border-b border-gray-900 pb-2" style={{ color: '#00ff66' }}>{t.projects.sectionTitle}</h2>
              {t.projects.projectsList.map((proj, index) => {
                const cardClass = "block bg-[#0f0f0f] border border-gray-900 rounded p-5 flex flex-col justify-between hover:border-[#00ff66]/40 transition group";
                const inner = (
                  <>
                    <div>
                      <h3 className="text-white font-bold mb-2 group-hover:text-[#00ff66] transition">{proj.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{proj.desc}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-mono text-[#00ff66]">{proj.tech}</span>
                      {proj.link && <span className="text-[10px] font-mono text-gray-600 group-hover:text-[#00ff66] transition">GitHub →</span>}
                    </div>
                  </>
                );
                return proj.link
                  ? <a key={index} href={proj.link} target="_blank" rel="noopener noreferrer" className={cardClass}>{inner}</a>
                  : <div key={index} className={cardClass}>{inner}</div>;
              })}
            </div>

            <div id="articles" className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest border-b border-gray-900 pb-2" style={{ color: '#00ff66' }}>{t.projects.articlesTitle}</h2>
              <div className="space-y-4">
                {t.projects.articlesList.map((art, index) => (
                  <a key={index} href="https://medium.com/@egemender" target="_blank" rel="noopener noreferrer" className="block bg-[#0f0f0f] border border-gray-900 rounded p-4 hover:border-[#00ff66]/30 transition group">
                    <h3 className="text-white font-semibold text-sm group-hover:text-[#00ff66] transition">{art.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{art.desc}</p>
                    <span className="inline-block text-[10px] font-mono text-[#00ff66] bg-gray-955 border border-gray-800 px-2 py-0.5 mt-3 rounded">{t.projects.mediumTag}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* REFERENCES */}
          <section id="references" className="space-y-4 scroll-mt-32">
            <h2 className="text-sm font-mono uppercase tracking-widest border-b border-gray-900 pb-2" style={{ color: '#00ff66' }}>{t.references.sectionTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {t.references.items.map((ref, idx) => (
                <div key={idx} className="bg-[#0f0f0f] border border-gray-900 rounded-lg p-5 space-y-3">
                  <div>
                    <h3 className="font-bold" style={{ color: '#ffffff' }}>{ref.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{ref.company} / {ref.role}</p>
                  </div>
                  <div className="space-y-1 text-xs font-mono text-gray-400 pt-2 border-t border-gray-955">
                    <div>{t.references.phoneLabel} <a href={`tel:${ref.phone}`} className="text-gray-400 hover:text-[#00ff66] transition">{ref.phone}</a></div>
                    <div>{t.references.emailLabel} <a href={`mailto:${ref.email}`} className="text-gray-400 hover:text-[#00ff66] transition">{ref.email}</a></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* SAĞ ALAN: INTERACTIVE TERMINAL WIDGET (1 Kolon Kaplar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-[236px] border border-gray-900 rounded-lg overflow-hidden shadow-2xl bg-[#050505]">
            {/* Terminal Top Bar */}
            <div className="bg-[#0f0f0f] px-4 py-2 flex items-center justify-between border-b border-gray-900">
              <div className="flex space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70 block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/70 block"></span>
                <span className="w-3 h-3 rounded-full bg-[#00ff66]/70 block"></span>
              </div>
              <span className="text-xs font-mono text-gray-500 select-none">bash - guest@egemen</span>
            </div>

            {/* Terminal Body */}
            <div ref={terminalBodyRef} className="p-3 sm:p-4 h-[280px] sm:h-[380px] lg:h-[450px] overflow-y-auto font-mono text-xs space-y-2 flex flex-col text-left">
              <div className="flex-1">
                {terminalHistory.map((line, index) => {
                  if (line.type === 'kali-prompt') {
                    return (
                      <div key={index} className="space-y-0.5 my-1 text-left font-mono text-xs">
                        <div className="flex items-center">
                          <span className="text-[#00ff66]">┌──(</span>
                          <span className="text-red-500 font-bold">guest</span>
                          <span className="text-red-500 mx-0.5">💀</span>
                          <span className="text-red-500 font-bold">egemen</span>
                          <span className="text-[#00ff66]">)-[</span>
                          <span className="text-white font-bold">{line.path}</span>
                          <span className="text-[#00ff66]">]</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-[#00ff66]">└─</span>
                          <span className="text-red-500 font-bold mr-2">$</span>
                          <span className="text-white font-bold">{line.command}</span>
                        </div>
                      </div>
                    );
                  }

                  if (line.type === 'rich') {
                    return (
                      <div key={index} className="whitespace-pre-wrap leading-relaxed">
                        {line.elements.map((el, elIdx) => (
                          <span key={elIdx} className={el.className}>
                            {el.text}
                          </span>
                        ))}
                      </div>
                    );
                  }

                  let colorClass = 'text-[#00ff66]';
                  if (line.type === 'input') {
                    colorClass = 'text-white font-bold';
                  } else if (line.type === 'system') {
                    colorClass = 'text-gray-400';
                  } else if (line.type === 'error') {
                    colorClass = 'text-red-400';
                  } else if (line.type === 'output') {
                    colorClass = 'text-gray-300';
                  } else if (line.type === 'exe') {
                    colorClass = 'text-[#00ff66] font-bold';
                  } else if (line.type === 'file') {
                    colorClass = 'text-gray-200';
                  }

                  return (
                    <div key={index} className={`whitespace-pre-wrap leading-relaxed ${colorClass}`}>
                      {renderTerminalText(line.text)}
                    </div>
                  );
                })}
              </div>
              
              {/* Terminal Input Form */}
              <div className="pt-2 border-t border-gray-900/50 text-left font-mono text-xs space-y-0.5">
                <div className="flex items-center">
                  <span className="text-[#00ff66]">┌──(</span>
                  <span className="text-red-500 font-bold">guest</span>
                  <span className="text-red-500 mx-0.5">💀</span>
                  <span className="text-red-500 font-bold">egemen</span>
                  <span className="text-[#00ff66]">)-[</span>
                  <span className="text-white font-bold">{currentPath === HOME_DIR ? '~' : (currentPath.startsWith(HOME_DIR + '/') ? '~' + currentPath.slice(HOME_DIR.length) : currentPath)}</span>
                  <span className="text-[#00ff66]">]</span>
                </div>
                <form onSubmit={handleCommand} className="flex items-center text-left">
                  <span className="text-[#00ff66] select-none">└─</span>
                  <span className="text-red-500 font-bold mr-2 select-none">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTabComplete}
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono p-0 focus:ring-0 text-left font-bold"
                    autoFocus
                    placeholder={t.terminal.placeholder}
                  />
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section with Language Prop */}
        <div className="lg:col-span-3 col-span-1">
          <FeedbackSection lang={lang} />
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-900 mt-24 py-8 text-center text-xs font-mono text-gray-600">
        &copy; {new Date().getFullYear()} {t.footer.copyright} {t.footer.secure}
      </footer>
    </div>
  );
}