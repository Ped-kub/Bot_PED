const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('เติมโค้ดรับแต้มรางวัล')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('ใส่รหัสโค้ดที่นี่')
                .setRequired(true)),
    async execute(interaction) {
        const codeInput = interaction.options.getString('code').trim(); // ตัดช่องว่างหน้าหลัง
        const userId = interaction.user.id;
        
        const codesPath = path.join(__dirname, '../../codes.json');
        const usersPath = path.join(__dirname, '../../users.json');

        // 1. อ่านไฟล์ Codes
        let allCodes = [];
        try {
            allCodes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
        } catch (e) { return interaction.reply({ content: '❌ ระบบขัดข้อง (ไม่พบฐานข้อมูลโค้ด)', ephemeral: true }); }

        // 2. ค้นหาโค้ด
        const codeIndex = allCodes.findIndex(c => c.code === codeInput);
        if (codeIndex === -1) {
            return interaction.reply({ content: '❌ **ไม่พบโค้ดนี้** หรือโค้ดไม่ถูกต้อง', ephemeral: true });
        }

        const codeData = allCodes[codeIndex];

        // 3. ตรวจสอบเงื่อนไข (ตามโจทย์: จำกัด 5 คน + ห้ามเติมซ้ำ)
        
        // เช็คว่าสิทธิ์เต็มหรือยัง?
        if (codeData.usedBy.length >= codeData.maxUses) {
            return interaction.reply({ content: '❌ **เสียใจด้วย!** โค้ดนี้มีผู้ใช้สิทธิ์ครบจำนวนแล้ว', ephemeral: true });
        }

        // เช็คว่าเคยเติมไปแล้วหรือยัง?
        if (codeData.usedBy.includes(userId)) {
            return interaction.reply({ content: '⚠️ **คุณเคยใช้โค้ดนี้ไปแล้ว** ไม่สามารถใช้ซ้ำได้อีกครับ', ephemeral: true });
        }

        // --- ✅ ผ่านทุกเงื่อนไข เริ่มกระบวนการเติมเงิน ---

        // 4. อัปเดตไฟล์ Users (เพิ่มแต้ม)
        let users = {};
        try {
            if (fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        } catch (e) {}

        // ถ้า User ใหม่ ไม่มีข้อมูล ให้เริ่มที่ 0
        if (!users[userId]) {
            users[userId] = { points: 0 };
        }

        // บวกแต้ม
        users[userId].points += codeData.points;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        // 5. อัปเดตไฟล์ Codes (บันทึกว่า User นี้ใช้แล้ว)
        allCodes[codeIndex].usedBy.push(userId);
        fs.writeFileSync(codesPath, JSON.stringify(allCodes, null, 2));

        // 6. แจ้งเตือน
        await interaction.reply({
            content: `🎉 **เติมโค้ดสำเร็จ!**\n💰 คุณได้รับ: **${codeData.points}** แต้ม\n💳 ยอดรวม: **${users[userId].points}** แต้ม\n(สิทธิ์คงเหลือของโค้ดนี้: ${codeData.maxUses - codeData.usedBy.length}/${codeData.maxUses})`,
            ephemeral: true
        });
    },
};