const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User'); // 1. เรียกใช้ Model User (เก็บ Cooldown)
const Code = require('../../models/Code'); // 2. เรียกใช้ Model Code (เก็บโค้ด)

// 🔥 ตั้งค่า: ใครมีสิทธิ์ใช้ และได้แต้มเท่าไหร่
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

        // 🛑 1. เช็คสิทธิ์ Admin
        if (!ADMIN_CONFIG[userId]) {
            return interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้' });
        }

        // 🛑 2. ระบบเช็ค Cooldown (จาก MongoDB)
        // ค้นหา User ใน Database
        let userData = await User.findOne({ userId: userId });
        
        const lastMonday = getLastMonday(); // เวลาวันจันทร์ล่าสุด (Date Object)
        
        // ถ้ามีข้อมูล User และมีประวัติกดใช้ (lastGencode)
        if (userData && userData.lastGencode) {
            // เช็คว่ากดไปล่าสุด "หลัง" วันจันทร์หรือยัง
            if (userData.lastGencode > lastMonday) {
                return interaction.editReply({ 
                    content: `⏳ **คุณใช้สิทธิ์ของสัปดาห์นี้ไปแล้ว!**\nรอรีเซ็ตวันจันทร์หน้าครับ`
                });
            }
        }

        // --- ✅ ผ่านเงื่อนไข เริ่มสร้างโค้ด ---
        const points = ADMIN_CONFIG[userId];
        const codeString = generateRandomCode(10);

        // 🔥 3. สร้างและบันทึกโค้ดลง MongoDB (Model Code)
        const newCode = new Code({
            code: codeString,
            points: points,
            maxUses: MAX_CLAIMS,
            createdBy: interaction.user.tag
        });

        await newCode.save(); // บันทึกโค้ด

        // 🔥 4. บันทึกเวลา Cooldown ลง MongoDB (Model User)
        // ถ้า User ยังไม่มีในระบบ ให้สร้างใหม่
        if (!userData) {
            userData = new User({ userId: userId, points: 0 });
        }
        
        userData.lastGencode = new Date(); // อัปเดตเวลาปัจจุบัน
        await userData.save(); // บันทึก User

        // ✅ แจ้งผล
        await interaction.editReply({
            content: `✅ **สร้างโค้ดสำเร็จ!**\n🎫 รหัส: \`${codeString}\`\n👥 จำนวนสิทธิ์: **${MAX_CLAIMS} คน**\n💎 มูลค่า: **${points}** แต้ม/คน`
        });
    },
};