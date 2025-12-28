const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// 🔥 1. ตั้งค่า: ใครมีสิทธิ์ใช้ และได้แต้มเท่าไหร่
const ADMIN_CONFIG = {
    '910909335784288297': 10,  //เป็ด
    '774417760281165835': 5,   // พี่เเอล
    '1319982025557413949': 4,  //คุณมิริม
    '1056886143754444840': 3,  //เกโต้
    '926336093253677157': 2,   //โอม
    '1390444294988369971': 1,  //พี่โทจิ
};

const MAX_CLAIMS = 5;

// ฟังก์ชันหา "วันจันทร์ล่าสุด"
function getLastMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gencode')
        .setDescription(`สร้างโค้ดรางวัล (จำกัด ${MAX_CLAIMS} คน/โค้ด, รีเซ็ตทุกจันทร์)`),
        
    async execute(interaction) {
        const userId = interaction.user.id;
        const logPath = path.join(__dirname, '../../usage_logs.json');
        const dbPath = path.join(__dirname, '../../codes.json');

        // 🛑 1. เช็คสิทธิ์ Admin
        if (!ADMIN_CONFIG[userId]) {
            return interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
        }

        // 🛑 2. ระบบเช็ค Cooldown รายสัปดาห์
        let usageLogs = {};
        try {
            if (fs.existsSync(logPath)) usageLogs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {}

        const lastMonday = getLastMonday().getTime();
        const lastUsed = usageLogs[userId] || 0;

        if (lastUsed > lastMonday) {
            return interaction.reply({ 
                content: `⏳ **คุณใช้สิทธิ์ของสัปดาห์นี้ไปแล้ว!**\nรอรีเซ็ตวันจันทร์หน้าครับ`, 
                ephemeral: true 
            });
        }

        // --- ✅ เริ่มสร้างโค้ด ---
        const points = ADMIN_CONFIG[userId];
        const code = generateRandomCode(10);

        // โหลดข้อมูลเก่า
        let existingCodes = [];
        try {
            const fileData = fs.readFileSync(dbPath, 'utf8');
            existingCodes = JSON.parse(fileData);
        } catch (err) {}

        // 🔥 3. บันทึกรูปแบบใหม่ รองรับ 5 คน
        existingCodes.push({
            code: code,
            points: points,
            maxUses: MAX_CLAIMS, // กำหนดว่าใช้ได้ 5 คน
            usedBy: [],          // เก็บ List ID คนที่กดใช้ไปแล้ว (เริ่มจากว่างเปล่า)
            createdBy: interaction.user.tag,
            createdAt: new Date().toISOString()
        });

        fs.writeFileSync(dbPath, JSON.stringify(existingCodes, null, 2));

        // อัปเดต Log การใช้งานของ Admin
        usageLogs[userId] = Date.now();
        fs.writeFileSync(logPath, JSON.stringify(usageLogs, null, 2));

        await interaction.editReply({
            content: `✅ **สร้างโค้ดสำเร็จ!**\n🎫 รหัส: \`${code}\`\n👥 จำนวนสิทธิ์: **${MAX_CLAIMS} คน**\n💎 มูลค่า: **${points}** แต้ม/คน`,
            ephemeral: true 
        });
    },
};