const { SlashCommandBuilder, EmbedBuilder } = require('discord.js'); // ใช้ Embed เพื่อความสวยงาม
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('เช็คยอดแต้มสะสมของคุณ')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('ดูยอดของคนอื่น (เว้นว่างเพื่อดูของตัวเอง)')
                .setRequired(false)),
    async execute(interaction) {
        // ถ้ามีการระบุ user ให้ดูของคนนั้น ถ้าไม่มีให้ดูของตัวเอง
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        const usersPath = path.join(__dirname, '../../users.json');

        let users = {};
        try {
            if (fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        } catch (e) {}

        // ดึงแต้ม (ถ้าไม่มีให้เป็น 0)
        const points = users[userId] ? users[userId].points : 0;

        // สร้างการ์ดสวยๆ (Embed)
        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // สีเขียว
            .setTitle(`💳 กระเป๋าเเต้มของ ${targetUser.username}`)
            .setDescription(`ยอดแต้มคงเหลือปัจจุบัน`)
            .addFields({ name: 'แต้มสะสม', value: `**${points.toLocaleString()}** แต้ม`, inline: true })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};