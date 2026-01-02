const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('ลบทุกข้อความในห้อง (สร้างห้องใหม่)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // --- ส่วนตรวจสอบสิทธิ์ (Optional - เปลี่ยนตามความเหมาะสม) ---
        const allowedRoles = ['Admin', 'Moderator']; 
        const hasRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.name));

        if (!hasRole) {
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้!', ephemeral: true });
        }

        // 1. สำคัญมาก: สั่ง deferReply ทันทีเพื่อแก้ปัญหา Timeout
        // บอทจะขึ้นว่า "Thinking..." เพื่อรอให้เราทำงานเสร็จ
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel;

        try {
            // 2. เริ่มกระบวนการ Clone ห้อง
            const newChannel = await channel.clone({
                reason: `Nuke โดย ${interaction.user.tag}`
            });
            
            // ย้ายตำแหน่งห้องใหม่มาที่เดิม
            await newChannel.setPosition(channel.position);

            // 3. ลบห้องเก่า
            // หลังจากคำสั่งนี้ interaction จะใช้ไม่ได้กับห้องเดิมแล้ว
            await channel.delete(`Nuke โดย ${interaction.user.tag}`);

            // 4. ส่งข้อความแจ้งเตือนในห้องใหม่แทน
            const nukeEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('☢️ ห้องนี้ถูกล้างข้อมูลแล้ว!')
                .setDescription(`ดำเนินการโดย: ${interaction.user}`)
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2I0YjFkN2Y0YjFkN2Y0YjFkN2Y0YjFkN2Y0YjFkN2Y0YjFkN2Y0JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/HhTXt43pk1I1W/giphy.gif')
                .setTimestamp();

            await newChannel.send({ embeds: [nukeEmbed] });

            // 5. แจ้งกลับไปยัง Interaction (ถึงแม้ห้องจะถูกลบไปแล้ว แต่เป็นการปิด Interaction ให้สมบูรณ์)
            // หมายเหตุ: ในบางกรณีอาจจะ error ตรงนี้เพราะห้องเดิมหายไปแล้ว แต่กระบวนการ nuke จะสำเร็จแน่นอน
        } catch (error) {
            console.error('Nuke Error:', error);
            try {
                // หากเกิด error ให้แก้ข้อความ "Thinking..." เป็นข้อความผิดพลาด
                await interaction.editReply({ content: 'เกิดข้อผิดพลาดในการ Nuke ห้อง บอทอาจขาดสิทธิ์ Manage Channels' });
            } catch (err) {
                // ถ้าแก้ไขไม่ได้ (เพราะห้องถูกลบไปแล้ว) ให้ปล่อยผ่าน
            }
        }
    },
};