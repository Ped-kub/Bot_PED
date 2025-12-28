const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User'); // 1. เรียกใช้ Model ของ MongoDB

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

        // 2. ดึงข้อมูลจาก MongoDB แทนการอ่านไฟล์
        // ค้นหา User ที่มี userId ตรงกัน
        let userData = await User.findOne({ userId: userId });

        // 3. ถ้าไม่เจอข้อมูล (ยังไม่เคยมีประวัติ) ให้ถือว่ามี 0 แต้ม
        const points = userData ? userData.points : 0;

        // สร้างการ์ดสวยๆ (Embed)
        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // สีเขียว
            .setTitle(`💳 กระเป๋าแต้มของ ${targetUser.username}`)
            .setDescription(`ยอดแต้มคงเหลือปัจจุบัน`)
            .addFields({ name: 'แต้มสะสม', value: `**${points.toLocaleString()}** แต้ม`, inline: true })
            .setTimestamp();

        // ใช้ editReply ตามมาตรฐาน index.js ใหม่
        await interaction.editReply({ embeds: [embed] });
    },
};