# 📁 项目文件结构

*最后生成时间*: 2025-07-03 20:46:34

代码仓库目录层级 (深度 ≤ 2)
```
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── prisma/
│   │   ├── dev.db
│   │   ├── dev.db-journal
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   ├── .env
│   ├── Dockerfile
│   ├── env.example
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── config/
│   ├── package-lock.json
│   ├── package.json
│   └── requirements.txt
├── database/
│   └── init.sql
├── deployment/
│   ├── docker/
│   │   ├── docker-compose-local.yml
│   │   ├── docker-compose.yml
│   │   ├── DOCKER_NETWORK_SOLUTION.md
│   │   └── fix_docker_network.sh
│   └── scripts/
│       ├── auto_update_readme.py
│       ├── docker_smart_fixer.py
│       ├── docker_system_fixer_v2.py
│       ├── fix_docker_system.py
│       ├── fix_system_login.py
│       ├── launch_system.py
│       ├── quick-start.sh
│       ├── quick_login_fix.sh
│       ├── quick_start.py
│       ├── smart-launch.sh
│       ├── start-local.sh
│       ├── start-system.sh
│       ├── start_local_system.py
│       ├── start_system_fixed.py
│       ├── system_status_check.sh
│       └── three_mode_launcher.py
├── docker/
│   ├── config/
│   │   └── daemon.json
│   ├── dockerfiles/
│   │   ├── backend.dev.Dockerfile
│   │   ├── backend.Dockerfile
│   │   ├── frontend.dev.Dockerfile
│   │   └── frontend.Dockerfile
│   ├── scripts/
│   │   ├── cleanup.sh
│   │   ├── create-offline-package.sh
│   │   ├── health-check.sh
│   │   ├── pull-images.sh
│   │   ├── setup-docker.sh
│   │   └── smart-pull-images.sh
│   ├── troubleshooting/
│   │   └── image-pull-issues.md
│   ├── docker-compose-fixed.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.yml
│   ├── docker-fix-login-solution.sh
│   ├── docker-images-report.txt
│   ├── docker-setup-report.txt
│   ├── DOCKER_FIX_COMPLETE_GUIDE.md
│   ├── DOCKER_IMAGE_PULL_SOLUTION.md
│   ├── fix-docker-complete.sh
│   ├── quick-status-check.sh
│   └── README.md
├── docs/
│   ├── api/
│   │   └── API_DESIGN.md
│   ├── BI_VISUALIZATION.md
│   ├── DEPLOYMENT_ROADMAP.md
│   ├── DEVELOPMENT_SCHEDULE.md
│   ├── MOBILE_ADAPTATION.md
│   ├── PROJECT_STRUCTURE.md
│   ├── QUICK_START.md
│   ├── SYSTEM_LAUNCH_GUIDE.md
│   └── TRANSACTIONS_GUIDE.md
├── examples/
│   ├── demo/
│   │   └── demo.html
│   └── test/
│       ├── login-test.html
│       └── test-login.js
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.local
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── quantification/
│   ├── count-files.bat
│   ├── project-stats.json
│   ├── project-stats.md
│   ├── README.md
│   ├── stats-config.json
│   ├── Update-ProjectStats.ps1
│   ├── update-stats.js
│   └── update_stats.py
├── scripts/
│   ├── fix-login.sh
│   ├── generate_project_structure.py
│   ├── quick-fix-login.sh
│   ├── quick-start.ps1
│   ├── setup.ps1
│   ├── setup.sh
│   ├── start-dev.ps1
│   ├── start-dev.sh
│   ├── start-local.sh
│   ├── update-stats.ps1
│   └── update-stats.sh
├── tools/
├── tradingimages/
│   ├── economicdataserieslist/
│   │   ├── fed_indicators_analysis.xlsx
│   │   ├── README.md
│   │   ├── 经济指标分析报告_20250702_150337.xlsx
│   │   ├── 经济指标分析报告_20250702_160637.xlsx
│   │   ├── 经济指标分析报告_20250702_161156.xlsx
│   │   ├── 经济指标分析报告_20250702_161427.xlsx
│   │   ├── 经济指标数据库_20250702_150338.json
│   │   ├── 经济指标数据库_20250702_160638.json
│   │   ├── 经济指标数据库_20250702_161157.json
│   │   └── 经济指标数据库_20250702_161428.json
│   ├── formatting-prompts/
│   │   ├── 02-cursor-rules.md
│   │   ├── quick_formatting_prompt.md
│   │   └── README.md
│   ├── iplt/
│   │   ├── doc/
│   │   ├── iplt-details/
│   │   └── readme.md
│   ├── itpm-series/
│   │   └── HowToGetTradeLikeGod.md
│   ├── itpm-tools/
│   │   ├── complete_economic_indicators_analyzer.py
│   │   ├── economic_indicators_extractor.py
│   │   ├── generate_mindmap.py
│   │   ├── md_to_mindmap.py
│   │   ├── merge_bilingual_outline.py
│   │   ├── merge_potm_details.py
│   │   ├── merge_potm_series.py
│   │   ├── run_analysis_and_visualize.py
│   │   ├── test_expanded_fed_indicators.py
│   │   └── translate-transform.py
│   ├── pftm/
│   │   ├── pftm-details/
│   │   ├── pftm_mindmap/
│   │   ├── pftm_mindmap_output/
│   │   └── pftm-combines.md
│   ├── potm/
│   │   ├── potm-details/
│   │   ├── Principles_of_Trading_Mastery_Combined_Bilingual.md
│   │   └── README.MD
│   └── ptm/
│       ├── combines/
│       ├── docs/
│       └── ptm-details/
├── wx-alipaycounts/
│   ├── alipay/
│   │   ├── 20220103_2088802561956321/
│   │   ├── 20220105_2088802561956321/
│   │   ├── 202201_2088802561956321/
│   │   ├── 202503_2088802561956321/
│   │   ├── .DS_Store
│   │   ├── 20220101_2088802561956321.zip
│   │   ├── 20220102_2088802561956321.zip
│   │   ├── 20220103_2088802561956321.zip
│   │   ├── 20220104_2088802561956321.zip
│   │   ├── 20220105_2088802561956321.zip
│   │   ├── 202201_2088802561956321.zip
│   │   ├── 20250101_2088802561956321.zip
│   │   ├── 20250325_2088802561956321.zip
│   │   └── 202503_2088802561956321.zip
│   ├── wxpay/
│   │   ├── 微信支付账单(20220101-20220401)——【解压密码可在微信支付公众号查看】/
│   │   ├── 微信支付账单(20250413-20250625)——【解压密码可在微信支付公众号查看】/
│   │   ├── .DS_Store
│   │   ├── 微信支付账单(20220101-20220401)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20220402-20220702)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20220703-20221003)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20220704-20221004)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20221005-20230105)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20230106-20230406)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20230407-20230707)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20230708-20231008)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20231009-20240108)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20240109-20240409)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20240410-20240710)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20240711-20241011)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20241011-20250111)——【解压密码可在微信支付公众号查看】 (1).zip
│   │   ├── 微信支付账单(20241011-20250111)——【解压密码可在微信支付公众号查看】.zip
│   │   ├── 微信支付账单(20250112-20250412)——【解压密码可在微信支付公众号查看】.zip
│   │   └── 微信支付账单(20250413-20250625)——【解压密码可在微信支付公众号查看】.zip
│   ├── .DS_Store
│   └── 微信支付导入模板.xlsx
├── ~/
│   └── .docker/
│       └── daemon.json
├── .gitignore
├── docker-compose.yml
├── quick-launch.py
└── README.md
```

---

*本文件由 scripts/generate_project_structure.py 自动生成*