const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User'); // 1. เรียกใช้ Model MongoDB

// 🛒 --- โซนตั้งค่าสินค้า ---
const SHOP_CONFIG = {
    'vip': { 
        roleId: '1453868175358955723', // ID ยศ VIP
        price: 200, 
        label: '👑 VIP Member' 
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buyrole')
        .setDescription('ใช้แต้มแลกซื้อยศ')
        .addStringOption(option =>
            option.setName('role')
                .setDescription('เลือกยศที่ต้องการแลก')
                .setRequired(true)
                .addChoices(
                    { name: '👑 VIP (200 แต้ม)', value: 'vip' },
                )
        ),

    async execute(interaction) {
        const selectedKey = interaction.options.getString('role');
        const item = SHOP_CONFIG[selectedKey];
        const userId = interaction.user.id;

        // 1. เช็คว่ามีข้อมูลสินค้านี้จริงไหม
        if (!item) {
            return interaction.editReply({ content: '❌ ไม่พบข้อมูลสินค้านี้ในระบบ' });
        }

        // 2. โหลดข้อมูลแต้มจาก MongoDB
        // ค้นหา User (ถ้าไม่เจอก็จะได้ค่า null)
        let userData = await User.findOne({ userId: userId });
        
        // ถ้าไม่มีข้อมูล หรือไม่มีฟิลด์ points ให้ถือเป็น 0
        const currentPoints = userData ? userData.points : 0;

        // 3. เช็คเงิน: แต้มพอไหม?
        if (currentPoints < item.price) {
            return interaction.editReply({ 
                content: `❌ **แต้มไม่พอ!**\nสินค้านี้ราคา: **${item.price}** แต้ม\nคุณมีอยู่: **${currentPoints}** แต้ม` 
            });
        }

        // 4. เช็คยศ: มีอยู่แล้วหรือยัง?
        const member = interaction.member; 
        if (member.roles.cache.has(item.roleId)) {
            return interaction.editReply({ 
                content: `⚠️ **คุณมียศ ${item.label} อยู่แล้วครับ** ไม่จำเป็นต้องซื้อเพิ่ม` 
            });
        }

        // --- ✅ ผ่านเงื่อนไข เริ่มการซื้อขาย ---

        // 5. พยายามให้ยศ
        try {
            const roleToAdd = interaction.guild.roles.cache.get(item.roleId);
            if (!roleToAdd) {
                return interaction.editReply({ content: '❌ หา ID ยศในเซิร์ฟเวอร์ไม่เจอ (กรุณาแจ้งแอดมิน)' });
            }
            
            await member.roles.add(roleToAdd);
        } catch (error) {
            console.error(error);
            return interaction.editReply({ 
                content: '❌ **เกิดข้อผิดพลาด:** บอทไม่สามารถให้ยศได้\n(โปรดตรวจสอบว่ายศบอทอยู่สูงกว่ายศที่จะแจก หรือ ID ยศถูกต้องหรือไม่)' 
            });
        }

        // 6. หักแต้มและบันทึกลง MongoDB
        // เนื่องจากผ่านด่านเช็คแต้มมาแล้ว แสดงว่า userData ต้องมีอยู่จริง (ไม่ใช่ null)
        userData.points -= item.price;
        await userData.save(); // บันทึกข้อมูล

        // 7. แจ้งเตือนความสำเร็จ
        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // สีเขียว
            .setTitle('🛒 แลกซื้อสำเร็จ!')
            .setDescription(`คุณได้รับยศ **${item.label}** เรียบร้อยแล้ว`)
            .addFields(
                { name: '💰 ราคา', value: `${item.price} แต้ม`, inline: true },
                { name: '💳 แต้มคงเหลือ', value: `${userData.points} แต้ม`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};