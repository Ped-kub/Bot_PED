const { SlashCommandBuilder } = require('discord.js');
const Code = require('../../models/Code');

// 🔒 ไอดีคนที่มีสิทธิ์
const ALLOWED_IDS = [
    '774417760281165835', 
    '910909335784288297'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createcode')
        .setDescription('สร้างโค้ดแจกแบบกำหนดวันหมดอายุ')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('ตั้งชื่อโค้ด (เช่น FLASH2025)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('uses')
                .setDescription('จำนวนสิทธิ์ (เช่น 50 คน)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('จำนวนแต้ม (ไม่ใส่ = 0)'))
        .addStringOption(option =>
            option.setName('reward') 
                .setDescription('ชื่อของรางวัล (ไม่ใส่ = ไม่มี)'))
        // 👇 ช่องระบุเวลาหมดอายุ
        .addStringOption(option =>
            option.setName('duration') 
                .setDescription('ระยะเวลาหมดอายุ (เช่น 1d = 1วัน, 12h = 12ชม., 30m = 30นาที)')),

    async execute(interaction) {
        if (!ALLOWED_IDS.includes(interaction.user.id)) {
            return interaction.editReply({ content: '❌ ไม่อนุญาต: คุณไม่มีสิทธิ์ใช้คำสั่งนี้' });
        }

        const codeName = interaction.options.getString('name');
        const maxUses = interaction.options.getInteger('uses');
        const points = interaction.options.getInteger('points') || 0;
        const reward = interaction.options.getString('reward') || null;
        const durationStr = interaction.options.getString('duration'); // รับค่าเวลา

        // 🛑 เช็คความถูกต้อง
        if (points <= 0 && !reward) return interaction.editReply('❌ ต้องแจกอย่างน้อย 1 อย่าง (แต้ม หรือ ของ)');
        if (maxUses <= 0) return interaction.editReply('❌ จำนวนคนต้องมากกว่า 0');

        // 🕒 คำนวณเวลาหมดอายุ
        let expiresAt = null;
        let timeText = "ไม่มีวันหมดอายุ";

        if (durationStr) {
            const timeValue = parseInt(durationStr);
            const timeUnit = durationStr.replace(/[0-9]/g, '').toLowerCase(); // เอาตัวเลขออก เหลือแต่หน่วย (d, h, m)
            const now = new Date();

            if (isNaN(timeValue)) return interaction.editReply('❌ ใส่เวลาไม่ถูก (เช่น 1d, 6h)');

            if (timeUnit === 'd') {
                expiresAt = new Date(now.getTime() + timeValue * 24 * 60 * 60 * 1000);
                timeText = `${timeValue} วัน`;
            } else if (timeUnit === 'h') {
                expiresAt = new Date(now.getTime() + timeValue * 60 * 60 * 1000);
                timeText = `${timeValue} ชั่วโมง`;
            } else if (timeUnit === 'm') {
                expiresAt = new Date(now.getTime() + timeValue * 60 * 1000);
                timeText = `${timeValue} นาที`;
            } else {
                return interaction.editReply('❌ หน่วยเวลาไม่ถูกต้อง! ใช้ d (วัน), h (ชม.), m (นาที) เช่น `1d`');
            }
        }

        // เช็คโค้ดซ้ำ
        const existingCode = await Code.findOne({ code: codeName });
        if (existingCode) return interaction.editReply(`❌ โค้ด \`${codeName}\` มีอยู่แล้ว`);

        try {
            const newCode = new Code({
                code: codeName,
                points,
                reward,
                maxUses,
                expiresAt, // บันทึกเวลาหมดอายุ
                createdBy: interaction.user.tag
            });

            await newCode.save();

            let msg = `✅ **สร้างโค้ดสำเร็จ!**\n🎫 รหัส: \`${codeName}\`\n👥 จำนวน: **${maxUses}** คน\n⏳ หมดอายุใน: **${timeText}**\n`;
            if (points > 0) msg += `💎 แจกแต้ม: **${points}**\n`;
            if (reward) msg += `🎁 แจกของ: **${reward}**\n`;

            await interaction.editReply({ content: msg });

        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการบันทึก' });
        }
    },
};