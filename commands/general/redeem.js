const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User'); // เรียกใช้ Model ผู้ใช้
const Code = require('../../models/Code'); // เรียกใช้ Model โค้ด

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('เติมโค้ดรับแต้มรางวัล')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('ใส่รหัสโค้ดที่นี่')
                .setRequired(true)),
    async execute(interaction) {
        const codeInput = interaction.options.getString('code').trim();
        const userId = interaction.user.id;

        // 1. ค้นหาโค้ดจาก MongoDB
        const codeData = await Code.findOne({ code: codeInput });

        // ถ้าไม่เจอโค้ด
        if (!codeData) {
            return interaction.editReply({ content: '❌ **ไม่พบโค้ดนี้** หรือโค้ดไม่ถูกต้อง' });
        }

        // 2. ตรวจสอบเงื่อนไข
        
        // เช็คว่าสิทธิ์เต็มหรือยัง?
        if (codeData.usedBy.length >= codeData.maxUses) {
            return interaction.editReply({ content: '❌ **เสียใจด้วย!** โค้ดนี้มีผู้ใช้สิทธิ์ครบจำนวนแล้ว' });
        }

        // เช็คว่าเคยเติมไปแล้วหรือยัง?
        if (codeData.usedBy.includes(userId)) {
            return interaction.editReply({ content: '⚠️ **คุณเคยใช้โค้ดนี้ไปแล้ว** ไม่สามารถใช้ซ้ำได้อีกครับ' });
        }

        // --- ✅ ผ่านเงื่อนไข เริ่มกระบวนการเติมเงิน ---

        // 3. อัปเดต User (เพิ่มแต้ม)
        // ค้นหา User ถ้าไม่มีให้สร้างใหม่ (upsert)
        let userData = await User.findOne({ userId: userId });
        if (!userData) {
            userData = new User({ userId: userId, points: 0 });
        }

        userData.points += codeData.points;
        await userData.save(); // บันทึกข้อมูลผู้ใช้

        // 4. อัปเดต Code (บันทึกว่า User นี้ใช้แล้ว)
        codeData.usedBy.push(userId);
        await codeData.save(); // บันทึกข้อมูลโค้ด

        // 5. แจ้งเตือน
        await interaction.editReply({
            content: `🎉 **เติมโค้ดสำเร็จ!**\n💰 คุณได้รับ: **${codeData.points}** แต้ม\n💳 ยอดรวม: **${userData.points}** แต้ม\n(สิทธิ์คงเหลือของโค้ดนี้: ${codeData.maxUses - codeData.usedBy.length}/${codeData.maxUses})`
        });
    },
};