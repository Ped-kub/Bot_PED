const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('ลบข้อความทั้งหมด (เฉพาะยศที่กำหนด)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // 1. ตรวจสอบยศ (ตัวอย่างใช้ชื่อยศ)
        const allowedRoles = ['Admin', 'Moderator']; 
        const hasRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.name));

        if (!hasRole) {
            return interaction.reply({ 
                content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้!', 
                ephemeral: true 
            });
        }

        const channel = interaction.channel;

        try {
            // 2. ใช้ deferReply เพื่อบอก Discord ว่าบอทกำลังประมวลผล (ป้องกัน Interaction Expired)
            await interaction.deferReply({ ephemeral: true });

            // 3. เริ่มทำการ Clone และ Delete
            const newChannel = await channel.clone({
                reason: `Nuke โดย ${interaction.user.tag}`
            });
            
            await newChannel.setPosition(channel.position);
            await channel.delete();

            // 4. ส่งข้อความในห้องใหม่ (ใช้ newChannel แทน interaction เพราะห้องเก่าตายไปแล้ว)
            const nukeEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('☢️ Room Nuked!')
                .setDescription(`ห้องถูกล้างข้อมูลเรียบร้อยโดย: ${interaction.user}`)
                .setTimestamp();

            await newChannel.send({ embeds: [nukeEmbed] });

        } catch (error) {
            console.error('Nuke Error:', error);
            
            // 5. การเช็คเพื่อป้องกัน Error ซ้ำซ้อน
            if (interaction.deferred || interaction.replied) {
                // ถ้าบอทเคยตอบไปแล้ว ให้ใช้ editReply แทน
                await interaction.editReply({ content: 'เกิดข้อผิดพลาดในการ Nuke ห้องนี้ บอทอาจขาดสิทธิ์ Manage Channels' });
            } else {
                await interaction.reply({ content: 'เกิดข้อผิดพลาดในการรันคำสั่ง', ephemeral: true });
            }
        }
    },
};