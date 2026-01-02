const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('ลบข้อความทั้งหมดในห้อง (แอดมินเท่านั้น)')
        // ชั้นที่ 1: ล็อกสิทธิ์ในระดับ Discord API (คำสั่งจะไม่ขึ้นให้คนอื่นเห็น หรือกดไม่ได้)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // ชั้นที่ 2: ตรวจสอบสิทธิ์ในโค้ดอีกครั้งเพื่อความชัวร์
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ เฉพาะผู้ที่มีสิทธิ์ **Administrator** เท่านั้นที่สามารถใช้คำสั่งนี้ได้!', 
                ephemeral: true 
            });
        }

        const channel = interaction.channel;

        try {
            // แจ้งเตือนก่อนเริ่ม
            await interaction.reply({ content: 'กำลังเริ่มกระบวนการ Nuke...', ephemeral: true });

            // สร้างห้องใหม่โดย Copy สิทธิ์และการตั้งค่าเดิมมาทั้งหมด
            const newChannel = await channel.clone({
                reason: `Nuke โดย Admin: ${interaction.user.tag}`
            });

            // ย้ายห้องใหม่ไปตำแหน่งเดิม
            await newChannel.setPosition(channel.position);

            // ลบห้องเก่า
            await channel.delete(`Nuke โดย Admin: ${interaction.user.tag}`);

            // ส่ง Embed แจ้งเตือนในห้องใหม่
            const nukeEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('☢️ Room Nuked!')
                .setDescription(`ข้อความทั้งหมดในห้องนี้ถูกล้างโดยแอดมิน ${interaction.user}`)
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2I0YjFkN2Y0YjFkN2Y0YjFkN2Y0YjFkN2Y0YjFkN2Y0YjFkN2Y0JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/HhTXt43pk1I1W/giphy.gif') // รูปประกอบระเบิด
                .setTimestamp();

            await newChannel.send({ embeds: [nukeEmbed] });

        } catch (error) {
            console.error('Nuke Error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'เกิดข้อผิดพลาด: บอทอาจจะไม่มีสิทธิ์จัดการห้อง (Manage Channels)', ephemeral: true });
            }
        }
    },
};