export const TRANSLATIONS = {
  tr: {
    nav: {
      about: 'Hakkımda',
      skills: 'Yetenekler',
      experience: 'Deneyim',
      education: 'Eğitim',
      projects: 'Projeler',
      references: 'Referanslar',
      feedback: 'Geri Bildirim'
    },
    about: {
      name: 'Egemen Der',
      title: 'Bilgisayar Mühendisi | Siber Güvenlik & Red Team',
      intro: 'İskenderun Teknik Üniversitesi Bilgisayar Mühendisliği mezunuyum. SOC operasyonlarında aktif olarak görev aldım ve bu süreçte SIEM yönetimi (Splunk, QRadar, Wazuh), güvenlik duvarı yapılandırmaları (FortiGate, pfSense) ve zafiyet tarama araçları (Nessus, Qualys, OpenVAS) konularında deneyim kazandım. Log analizi yapma, tehditleri erken aşamada tespit etme, ağ trafiğini inceleme ve zararlı yazılımların davranışlarını analiz etme konularında kendimi sürekli geliştirdim. Red Team alanına özel bir ilgi duyuyorum ve hem saldırı hem de savunma tarafındaki yetkinliklerimi her gün daha ileri taşımaya çalışıyorum. Detaylara önem veren, ekip çalışmasına uyumlu ve sorumluluk almaktan çekinmeyen bir yapıya sahip. Üstlendiğim her işi titiz, planlı ve profesyonel bir yaklaşımla tamamlamayı önemsiyorum.',
      contactLabels: {
        location: '📍 Konum:',
        email: '📧 E-posta:',
        phone: '📞 Telefon:',
        military: '🎖️ Askerlik:',
        languages: '🗣️ Diller:'
      },
      contactValues: {
        location: 'Nilüfer, Bursa, Türkiye',
        military: 'Tamamlandı',
        languages: 'İngilizce B1, Türkçe (Anadil)',
        languagesItems: ['İngilizce B1', 'Türkçe (Anadil)']
      }
    },
    skills: {
      sectionTitle: 'Yetenekler & Uzmanlıklar',
      categories: [
        { name: 'SIEM', skills: ['Splunk', 'IBM QRadar', 'Wazuh'] },
        { name: 'Kali Linux Araçları', skills: ['BurpSuite', 'Searchsploit', 'Nmap', 'Metasploit', 'Nikto'] },
        { name: 'Zafiyet Analizi', skills: ['Nessus', 'Qualys', 'OpenVAS'] },
        { name: 'Firewall', skills: ['FortiGate', 'pfSense'] },
        { name: 'Ağ Teknolojileri', skills: ['TCP/IP', 'OSI Layers', 'LAN/DNS', 'TCP/UDP', 'VPN', 'Wireshark', 'Whois', 'URLVoid', 'Phishing Analysis'] },
        { name: 'SOC Tecrübesi', skills: ['Log Analysis', 'Detection', 'Packet Analysis', 'Malware Analysis', 'Online Sandbox'] }
      ]
    },
    experience: {
      sectionTitle: 'Mesleki Geçmiş',
      items: [
        {
          company: 'ION Bilgi Teknolojileri | Ankara',
          role: 'SOC Stajyeri',
          date: '2025 - 2025',
          bullets: [
            'SOC operasyonları kapsamında Linux, Windows ve Windows Server platformlarında Wazuh SIEM entegrasyonunu başarıyla gerçekleştirdim.',
            'Wazuh’ta tehdit algılama yeteneklerini geliştirmek için özel kurallar ve uyarılar tasarlayıp uyguladım.',
            'Windows sistemlerinde merkezi log yönetimi sağlamak amacıyla Suricata (IDS) kurulumunu tamamlayarak Wazuh ile entegre ettim.',
            'Suricata kurulumu ve Wazuh entegrasyon süreçlerini kolaylaştırmak için kapsamlı bir teknik rapor hazırladım.',
            'SQL enjeksiyonu tespiti ve dosya bütünlüğü izleme (File Integrity Monitoring) için Wazuh yapılandırmasını optimize ettim.'
          ]
        },
        {
          company: 'BgTek Siber Güvenlik | Bursa',
          role: 'Stajyer',
          date: '2023 - 2024',
          bullets: [
            'Rastgele sayı dizilerinde belirli örüntüleri tespit etmek için bir C++ programı geliştirdim.',
            'Java’da Nesne Yönelimli Programlama (OOP) prensiplerini kullanarak basit bir “Market Yönetim Sistemi” oluşturdum.',
            'FreeRADIUS’u Kali Linux ortamına kurarak, merkezi kimlik doğrulama yönetimi için MySQL ile entegrasyonunu gerçekleştirdim.',
            'Penetrasyon testi sırasında DIWA sisteminde kritik bir “Admin NoPass” SQL açığını keşfettim ve düzeltme önerileriyle birlikte raporladım.',
            'Ağ segmentasyonu sağlamak için pfSense güvenlik duvarını kurdum ve Ubuntu Server ile yapılandırdım.',
            'Ubuntu Server üzerinde pfSense için yeni bir ağ arayüzü derledim ve başarıyla entegre ettim.'
          ]
        }
      ]
    },
    education: {
      sectionTitle: 'Eğitim & Sertifikalar',
      school: 'İskenderun Teknik Üniversitesi',
      degree: 'Bilgisayar Mühendisliği',
      date: '2020 - 2025',
      focusLabel: '🎯 Odak:',
      focus: 'Offensive Cybersecurity, Ağ ve Sistem Savunması',
      activities: 'Başkan Yardımcısı, ISTE Siber Kulübü (2023–2025)',
      activities2: 'İletişim Sorumlusu, ISTE Siber Kulübü (2021–2023)',
      certificationsHeader: 'Sertifikalar:',
      verifyBtn: 'Doğrula →',
      certifications: [
        { name: 'Certified Cybersecurity Foundations', link: 'https://hackviser.com/verify?id=HV-CORE-TFEQPOJ3' },
        { name: 'Cisco CyberOps Associate', link: 'https://www.credly.com/badges/9bc1d95b-efc4-4c74-957c-6d26580bd8ef/linked_in_profile' },
        { name: 'CCNAv7', link: 'https://www.credly.com/badges/100976fb-b9a6-42bf-b0fe-6106e60fdf61/public_url' },
        { name: 'ISO 27001', link: 'https://drive.google.com/file/d/1xpQm88qs5qgyZgCiyUNRNWcVlHOCuNjw/view' },
        { name: 'Turkcell Pentesting', link: 'https://gelecegiyazanlar.turkcell.com.tr/sertifika/da9c44cb87984c91b39d1db287027924' },
        { name: 'ICCW', link: 'https://drive.google.com/file/d/1yQY_RNAvsfKQtd15oHPQayZ9XMS4ajcf/view' },
        { name: 'Siber Güvenlik Uzmanlığı', link: 'https://drive.google.com/file/d/19UEmqx23aW2g21TaiN-OlrBdHxoEhTvM/view' },
        { name: 'English B1 Certificate', link: 'https://drive.google.com/file/d/1gP9dzQ_i_RrGtKkGiqAEtGs12b6tGZVk/view' }
      ]
    },
    projects: {
      sectionTitle: 'Projeler',
      articlesTitle: 'Zafiyet Araştırmaları',
      mediumTag: 'Medium / Write-up',
      projectsList: [
        {
          title: 'Sefer Otomasyon Sistemi',
          tech: 'C# / .NET',
          desc: 'İSTE kapsamında geliştirilen veritabanı destekli görsel programlama projesi. Lojistik ve sefer yönetimi süreçlerini otomatize eder.',
          link: 'https://github.com/Anogar-Dxilak/Sefer_otomasyon'
        },
        {
          title: 'CV Oluşturma Uygulaması',
          tech: 'PHP / HTML / CSS / AJAX',
          desc: 'Ajax, PHP, HTML ve CSS teknolojilerini geliştirmek amacıyla yazılmış dinamik CV oluşturma web uygulaması.',
          link: 'https://github.com/Anogar-Dxilak/CV-olusturma'
        },
        {
          title: 'Tır Otomasyon Sistemi',
          tech: 'JavaFX / Java',
          desc: 'Üniversite kapsamında geliştirilmiş kapsamlı lojistik ve tır otomasyon sistemi projesi. Araç takibi, sefer planlaması ve yük yönetimi özelliklerini içermektedir.',
          link: 'https://github.com/Anogar-Dxilak/Tir-Otomasyonu'
        }
      ],
      articlesList: [
        { title: 'Server-Side Template Injection (SSTI)', platform: 'Medium', desc: 'Sunucu taraflı şablon enjeksiyonu zafiyetleri ve sömürme yöntemleri üzerine teknik inceleme.' },
        { title: 'Client-Side Template Injection (CSTI)', platform: 'Medium', desc: 'İstemci taraflı şablon enjeksiyonu mekanizmaları ve korunma yolları.' }
      ]
    },
    references: {
      sectionTitle: 'Referanslar',
      phoneLabel: '📱 Telefon:',
      emailLabel: '📧 E-posta:',
      items: [
        {
          name: 'Alican Göktepe',
          company: 'ION Bilgi Teknolojileri',
          role: 'Kurucu',
          phone: '+90 535 550 72 39',
          email: 'alican.goktepe@ion.net.tr'
        }
      ]
    },
    feedback: {
      badge: '[SİSTEM_GERİ_BİLDİRİM // VERİ TABANI KANALI]',
      title: 'Geri Bildirim & Değerlendirme',
      subtitle: 'Sitedeki deneyiminizi, önerilerinizi veya Red Team projelerim hakkındaki düşüncelerinizi doğrudan iletebilirsiniz.',
      nameLabel: 'İsminiz / Rumuz',
      nameOptional: '(İsteğe bağlı)',
      namePlaceholder: 'Örn. Hacker0x1 / Ziyaretçi',
      categoryLabel: 'Kategori',
      ratingLabel: 'Puanınız',
      messageLabel: 'Geri Bildirim Mesajı',
      messagePlaceholder: 'Site veya projeler hakkındaki görüşleriniz, tavsiyeleriniz...',
      submitBtn: 'Geri Bildirimi Gönder',
      submitting: 'Gönderiliyor...',
      ratings: {
        1: 'Zayıf ⚠️',
        2: 'Geliştirilebilir 🛠️',
        3: 'İyi 👍',
        4: 'Çok İyi 🌟',
        5: 'Mükemmel (Red Team Approved) 🛡️'
      },
      categories: [
        'Genel',
        'Tasarım & UI',
        'Siber Güvenlik & SOC',
        'Kariyer & İletişim',
        'Öneri / Fikir'
      ],
      defaultAnonymous: 'Anonim Ziyaretçi',
      successMsg: 'Geri bildiriminiz başarıyla iletildi! Teşekkürler. 🚀',
      errorEmptyMsg: 'Lütfen bir geri bildirim mesajı yazın.'
    },
    terminal: {
      welcome: "Egemen'in CyberOS v1.0.0 sistemine hoş geldiniz...",
      helpInstruction: 'Kullanılabilir komutları görmek için "help" yazın.',
      commandsHeader: 'Kullanılabilir komutlar:',
      helpCmd: '  help        - Komut listesini göster',
      aboutCmd: '  about       - Profesyonel özet',
      skillsCmd: '  skills      - Siber güvenlik & geliştirme yeteneklerini listele',
      experienceCmd: '  experience  - İş deneyimi detaylarını görüntüle',
      educationCmd: '  education   - Eğitim geçmişi ve sertifikalar',
      contactCmd: '  contact     - İletişim bağlantıları ve bilgileri',
      lsCmd: '  ls          - Dosya ve dizinleri listele',
      cdCmd: '  cd [dizin]  - Dizini değiştir (Örn: cd Documents, cd ..)',
      catCmd: '  cat [dosya] - Dosya içeriğini oku (Örn: cat Desktop/notes.txt)',
      pwdCmd: '  pwd         - Aktif dizin yolunu göster',
      sherlockCmd: '  sherlock    - Sherlock OSINT Profil Tespit Aracını başlat (tools/sherlock)',
      clearCmd: '  clear       - Terminal ekranını temizle',
      notFound: 'Komut bulunamadı:',
      placeholder: 'help...'
    },
    footer: {
      copyright: 'Egemen Der. Tüm hakları saklıdır.',
      secure: 'Güvenli bağlantı garantilenmiştir.'
    }
  },

  en: {
    nav: {
      about: 'About',
      skills: 'Skills',
      experience: 'Experience',
      education: 'Education',
      projects: 'Projects',
      references: 'References',
      feedback: 'Feedback'
    },
    about: {
      name: 'Egemen Der',
      title: 'Computer Engineer | Cybersecurity & Red Team',
      intro: 'I graduated from Iskenderun Technical University with a degree in Computer Engineering. I actively worked in SOC operations, gaining extensive hands-on experience in SIEM management (Splunk, QRadar, Wazuh), firewall configurations (FortiGate, pfSense), and vulnerability assessment tools (Nessus, Qualys, OpenVAS). I continuously sharpen my skills in log analysis, early threat detection, packet analysis, and malware behavior analysis. Passionate about Red Teaming, I aim to elevate both my offensive and defensive capabilities every day. I am detail-oriented, a team player, and dependable, committed to completing every assignment with precision, structure, and professionalism.',
      contactLabels: {
        location: '📍 Location:',
        email: '📧 Email:',
        phone: '📞 Phone:',
        military: '🎖️ Military:',
        languages: '🗣️ Languages:'
      },
      contactValues: {
        location: 'Nilüfer, Bursa, Turkey',
        military: 'Completed',
        languages: 'English B1, Turkish (Native)',
        languagesItems: ['English B1', 'Turkish (Native)']
      }
    },
    skills: {
      sectionTitle: 'Skills & Expertise',
      categories: [
        { name: 'SIEM', skills: ['Splunk', 'IBM QRadar', 'Wazuh'] },
        { name: 'Kali Linux Tools', skills: ['BurpSuite', 'Searchsploit', 'Nmap', 'Metasploit', 'Nikto'] },
        { name: 'Vulnerability Assessment', skills: ['Nessus', 'Qualys', 'OpenVAS'] },
        { name: 'Firewalls', skills: ['FortiGate', 'pfSense'] },
        { name: 'Network Technologies', skills: ['TCP/IP', 'OSI Layers', 'LAN/DNS', 'TCP/UDP', 'VPN', 'Wireshark', 'Whois', 'URLVoid', 'Phishing Analysis'] },
        { name: 'SOC Experience', skills: ['Log Analysis', 'Detection', 'Packet Analysis', 'Malware Analysis', 'Online Sandbox'] }
      ]
    },
    experience: {
      sectionTitle: 'Professional Experience',
      items: [
        {
          company: 'ION Information Technologies | Ankara',
          role: 'SOC Intern',
          date: '2025 - 2025',
          bullets: [
            'Successfully integrated Wazuh SIEM across Linux, Windows, and Windows Server platforms as part of SOC operations.',
            'Designed and implemented custom detection rules and alert mechanisms in Wazuh to enhance threat detection capabilities.',
            'Installed Suricata IDS on Windows environments and integrated it with Wazuh for centralized log management.',
            'Authored a comprehensive technical report documenting Suricata deployment and Wazuh integration workflows.',
            'Optimized Wazuh configurations for SQL injection detection and File Integrity Monitoring (FIM).'
          ]
        },
        {
          company: 'BgTek Cybersecurity | Bursa',
          role: 'Intern',
          date: '2023 - 2024',
          bullets: [
            'Developed a C++ program to detect specific statistical patterns within pseudo-random number sequences.',
            'Built an Object-Oriented (OOP) Market Management System in Java.',
            'Installed FreeRADIUS on Kali Linux and configured MySQL integration for centralized authentication management.',
            'Discovered a critical "Admin NoPass" SQL Injection vulnerability in the DIWA system during penetration testing, providing remediation recommendations.',
            'Configured pfSense firewall with Ubuntu Server to establish network segmentation.',
            'Compiled and successfully integrated a new network interface driver for pfSense on Ubuntu Server.'
          ]
        }
      ]
    },
    education: {
      sectionTitle: 'Education & Certifications',
      school: 'Iskenderun Technical University',
      degree: 'B.S. Computer Engineering',
      date: '2020 - 2025',
      focusLabel: '🎯 Focus:',
      focus: 'Offensive Cybersecurity, Network & System Defense',
      activities: 'Vice President, ISTE Cyber Club (2023–2025)',
      activities2: 'Communications Lead, ISTE Cyber Club (2021–2023)',
      certificationsHeader: 'Certifications:',
      verifyBtn: 'Verify →',
      certifications: [
        { name: 'Certified Cybersecurity Foundations', link: 'https://hackviser.com/verify?id=HV-CORE-TFEQPOJ3' },
        { name: 'Cisco CyberOps Associate', link: 'https://www.credly.com/badges/9bc1d95b-efc4-4c74-957c-6d26580bd8ef/linked_in_profile' },
        { name: 'CCNAv7', link: 'https://www.credly.com/badges/100976fb-b9a6-42bf-b0fe-6106e60fdf61/public_url' },
        { name: 'ISO 27001', link: 'https://drive.google.com/file/d/1xpQm88qs5qgyZgCiyUNRNWcVlHOCuNjw/view' },
        { name: 'Turkcell Pentesting', link: 'https://gelecegiyazanlar.turkcell.com.tr/sertifika/da9c44cb87984c91b39d1db287027924' },
        { name: 'ICCW', link: 'https://drive.google.com/file/d/1yQY_RNAvsfKQtd15oHPQayZ9XMS4ajcf/view' },
        { name: 'Cybersecurity Specialization', link: 'https://drive.google.com/file/d/19UEmqx23aW2g21TaiN-OlrBdHxoEhTvM/view' },
        { name: 'English B1 Certificate', link: 'https://drive.google.com/file/d/1gP9dzQ_i_RrGtKkGiqAEtGs12b6tGZVk/view' }
      ]
    },
    projects: {
      sectionTitle: 'Projects',
      articlesTitle: 'Vulnerability Research',
      mediumTag: 'Medium / Write-up',
      projectsList: [
        {
          title: 'Expedition Automation System',
          tech: 'C# / .NET',
          desc: 'A database-driven visual programming project automating logistics and dispatch management workflows.',
          link: 'https://github.com/Anogar-Dxilak/Sefer_otomasyon'
        },
        {
          title: 'Dynamic CV Builder App',
          tech: 'PHP / HTML / CSS / AJAX',
          desc: 'A dynamic CV generation web app developed to implement Ajax, PHP, HTML, and CSS web technologies.',
          link: 'https://github.com/Anogar-Dxilak/CV-olusturma'
        },
        {
          title: 'Truck Logistics Automation',
          tech: 'JavaFX / Java',
          desc: 'A comprehensive logistics and truck automation system featuring fleet tracking, route planning, and cargo management.',
          link: 'https://github.com/Anogar-Dxilak/Tir-Otomasyonu'
        }
      ],
      articlesList: [
        { title: 'Server-Side Template Injection (SSTI)', platform: 'Medium', desc: 'Technical analysis on server-side template injection vulnerabilities and exploitation vectors.' },
        { title: 'Client-Side Template Injection (CSTI)', platform: 'Medium', desc: 'In-depth review of client-side template injection mechanics and mitigation techniques.' }
      ]
    },
    references: {
      sectionTitle: 'References',
      phoneLabel: '📱 Phone:',
      emailLabel: '📧 Email:',
      items: [
        {
          name: 'Alican Göktepe',
          company: 'ION Information Technologies',
          role: 'Founder',
          phone: '+90 535 550 72 39',
          email: 'alican.goktepe@ion.net.tr'
        }
      ]
    },
    feedback: {
      badge: '[SYSTEM_FEEDBACK // DATABASE_CHANNEL]',
      title: 'Feedback & Evaluation',
      subtitle: 'Feel free to share your thoughts, suggestions, or feedback regarding my Red Team projects and website experience.',
      nameLabel: 'Your Name / Alias',
      nameOptional: '(Optional)',
      namePlaceholder: 'e.g. Hacker0x1 / Visitor',
      categoryLabel: 'Category',
      ratingLabel: 'Your Rating',
      messageLabel: 'Feedback Message',
      messagePlaceholder: 'Your suggestions, recommendations, or thoughts...',
      submitBtn: 'Submit Feedback',
      submitting: 'Submitting...',
      ratings: {
        1: 'Weak ⚠️',
        2: 'Needs Improvement 🛠️',
        3: 'Good 👍',
        4: 'Very Good 🌟',
        5: 'Excellent (Red Team Approved) 🛡️'
      },
      categories: [
        'General',
        'Design & UI',
        'Cybersecurity & SOC',
        'Career & Contact',
        'Suggestion / Idea'
      ],
      defaultAnonymous: 'Anonymous Visitor',
      successMsg: 'Your feedback has been submitted successfully! Thank you. 🚀',
      errorEmptyMsg: 'Please write a feedback message.'
    },
    terminal: {
      welcome: "Welcome to Egemen's CyberOS v1.0.0...",
      helpInstruction: 'Type "help" to see available commands.',
      commandsHeader: 'Available commands:',
      helpCmd: '  help        - Display command list',
      aboutCmd: '  about       - Professional summary',
      skillsCmd: '  skills      - List cybersecurity & development skills',
      experienceCmd: '  experience  - View work experience details',
      educationCmd: '  education   - Education history and certifications',
      contactCmd: '  contact     - Contact links and info',
      lsCmd: '  ls          - List files and directories',
      cdCmd: '  cd [dir]    - Change directory (e.g. cd Documents, cd ..)',
      catCmd: '  cat [file]  - Read file contents (e.g. cat Desktop/notes.txt)',
      pwdCmd: '  pwd         - Print working directory path',
      sherlockCmd: '  sherlock    - Launch Sherlock OSINT Profile Finder Tool (tools/sherlock)',
      clearCmd: '  clear       - Clear terminal screen',
      notFound: 'Command not found:',
      placeholder: 'type help...'
    },
    footer: {
      copyright: 'Egemen Der. All rights reserved.',
      secure: 'Secure connection guaranteed.'
    }
  }
};
