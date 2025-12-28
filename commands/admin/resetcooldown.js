const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User'); // 1. เรียกใช้ Model MongoDB

// 🔒 ใส่ ID ของคุณ (เจ้าของบอท)
const OWNER_ID = '910909335784288297'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetcooldown')
        .setDescription('ปลดล็อกคูลดาวน์รายสัปดาห์ให้ผู้ใช้ (Owner Only)')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('เลือกคนที่ต้องการรีเซ็ต')
                .setRequired(true)),

    async execute(interaction) {
        // 1. เช็คว่าเป็นเจ้าของบอทหรือไม่?
        if (interaction.user.id !== OWNER_ID) {
            return interaction.editReply({ 
                content: '❌ คำสั่งนี้ใช้ได้เฉพาะเจ้าของบอทเท่านั้นครับ'
            });
        }

        const targetUser = interaction.options.getUser('target');

        // 2. ค้นหาข้อมูลผู้ใช้จาก MongoDB
        let userData = await User.findOne({ userId: targetUser.id });

        // 3. เช็คว่าคนนี้เคยใช้งานไปหรือยัง (ดูที่ field lastGencode)
        if (!userData || !userData.lastGencode) {
            return interaction.editReply({ 
                content: `⚠️ **${targetUser.username}** ยังไม่ได้ใช้งานโควต้าของสัปดาห์นี้เลยครับ (ไม่ต้องรีเซ็ต)`
            });
        }

        // 4. ลบเวลาใช้งานออก (รีเซ็ตเป็น null)
        userData.lastGencode = null;
        await userData.save(); // บันทึกข้อมูลลง MongoDB

        // 5. แจ้งผล
        await interaction.editReply({
            content: `✅ **ปลดล็อกเรียบร้อย!**\nรีเซ็ตคูลดาวน์ให้คุณ ${targetUser} แล้ว\nเขาสามารถกดรับโค้ดใหม่ได้ทันทีครับ 🎉`
        });
    },
};