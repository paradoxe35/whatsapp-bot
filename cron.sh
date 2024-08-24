sudo crontab -e

# In Africa/Kigali it's 7AM 30
30 5 * * * TZ=UTC /bin/systemctl restart whatsapp-bot.service
