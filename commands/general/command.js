const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('secretcommand')
        .setDescription('คำสั่งลับสำหรับคนมียศที่กำหนดเท่านั้น'),
    async execute(interaction) {
     const configPath = path.join(__dirname, '../../config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);

        // 2. ดึง Role ID ที่อนุญาตจาก config
        const allowedRoleID = config.authorizedRoleId; 
        
        // 3. ตรวจสอบยศ
        if (!allowedRoleID || !interaction.member.roles.cache.has(allowedRoleID)) {
            return interaction.reply({ 
                content: 'ขอโทษด้วยครับ คำสั่งนี้ใช้ได้เฉพาะคนมียศที่กำหนดไว้เท่านั้น', 
                ephemeral: true 
            });
        }

        // หากมียศที่ต้องการ โค้ดส่วนนี้จะทำงานต่อ
        await interaction.reply('ยินดีต้อนรับครับ! คุณมียศที่ถูกต้อง ✅');
    },
};