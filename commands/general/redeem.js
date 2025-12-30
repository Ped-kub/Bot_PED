const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const Code = require('../../models/Code');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('เติมโค้ดรับรางวัล')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('ใส่รหัสโค้ด')
                .setRequired(true)),
    async execute(interaction) {
        const codeInput = interaction.options.getString('code').trim();
        const userId = interaction.user.id;

        const codeData = await Code.findOne({ code: codeInput });

        if (!codeData) return interaction.editReply('❌ **ไม่พบโค้ดนี้** หรือโค้ดไม่ถูกต้อง');

        // --- 🕒 เช็ควันหมดอายุ ---
        if (codeData.expiresAt) {
            const now = new Date();
            if (now > codeData.expiresAt) {
                return interaction.editReply('❌ **เสียใจด้วย!** โค้ดนี้หมดอายุไปแล้วครับ ⏳');
            }
        }

        if (codeData.usedBy.length >= codeData.maxUses) return interaction.editReply('❌ **เสียใจด้วย!** โค้ดนี้สิทธิ์เต็มแล้ว');
        if (codeData.usedBy.includes(userId)) return interaction.editReply('⚠️ **คุณเคยใช้โค้ดนี้ไปแล้ว**');

        // ... (ส่วนแจกของ เหมือนเดิมเป๊ะ) ...
        let userData = await User.findOne({ userId: userId });
        if (!userData) userData = new User({ userId: userId, points: 0 });

        let replyMessage = `🎉 **เติมโค้ดสำเร็จ! (` + codeInput + `)**\n`;

        if (codeData.points > 0) {
            userData.points += codeData.points;
            replyMessage += `💰 คุณได้รับ: **${codeData.points}** แต้ม\n`;
        }

        if (codeData.reward) {
            replyMessage += `🎁 คุณได้รับของรางวัล: **${codeData.reward}**\n*(⚠️ กรุณาแคปภาพแจ้งแอดมิน)*\n`;
        }

        await userData.save();
        codeData.usedBy.push(userId);
        await codeData.save();

        replyMessage += `💳 แต้มสะสมรวม: **${userData.points}**\n`;
        replyMessage += `(สิทธิ์คงเหลือ: ${codeData.maxUses - codeData.usedBy.length}/${codeData.maxUses})`;

        await interaction.editReply({ content: replyMessage });
    },
};