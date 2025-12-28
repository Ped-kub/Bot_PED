const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// 🔒 ใส่ ID ของคุณ (เจ้าของบอท) คนเดียวเท่านั้น
const OWNER_ID = '946050505123456789'; 

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
                content: '❌ คำสั่งนี้ใช้ได้เฉพาะเจ้าของบอทเท่านั้นครับ', 
                ephemeral: true 
            });
        }

        const targetUser = interaction.options.getUser('target');
        const logPath = path.join(__dirname, '../../usage_logs.json');

        // 2. โหลดไฟล์ประวัติการใช้งาน
        let usageLogs = {};
        try {
            if (fs.existsSync(logPath)) {
                usageLogs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            }
        } catch (e) {
            return interaction.editReply({ content: '❌ ไม่พบไฟล์ประวัติการใช้งาน (ยังไม่มีใครใช้คำสั่ง)', ephemeral: true });
        }

        // 3. เช็คว่าคนนี้เคยใช้งานไปหรือยัง
        if (!usageLogs[targetUser.id]) {
            return interaction.editReply({ 
                content: `⚠️ **${targetUser.username}** ยังไม่ได้ใช้งานโควต้าของสัปดาห์นี้เลยครับ (ไม่ต้องรีเซ็ต)`, 
                ephemeral: true 
            });
        }

        // 4. ลบข้อมูลการใช้งานของคนนี้ออก (รีเซ็ต)
        delete usageLogs[targetUser.id];
        
        // บันทึกไฟล์กลับ
        fs.writeFileSync(logPath, JSON.stringify(usageLogs, null, 2));

        // 5. แจ้งผล
        await interaction.editReply({
            content: `✅ **ปลดล็อกเรียบร้อย!**\nรีเซ็ตคูลดาวน์ให้คุณ ${targetUser} แล้ว\nเขาสามารถกดรับโค้ดใหม่ได้ทันทีครับ 🎉`
        });
    },
};