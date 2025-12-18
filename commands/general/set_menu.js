const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    AttachmentBuilder,
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits 
} = require('discord.js');

const file = new AttachmentBuilder('./images/Ped.png'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_menu')
        .setDescription('สร้างเมนูสำหรับเลือกสร้างห้องอัตโนมัติ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('บริการต่างๆ')
            .setDescription('เลือกบริการจากด้านล่างได้เลย')
            .setImage('attachment://Ped.png')
            .setTimestamp()
            .setFooter({ text: '© BOT By. Ped' });

        const select = new StringSelectMenuBuilder()
            .setCustomId('room_setup')
            .setPlaceholder('เลือกบริการตรงนี้')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('ซื้อของ')
                    .setDescription('ซื้อของจากพี่ TOJI')
                    .setEmoji('🧺')
                    .setValue('create_item'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('จ้างฟาร์ม')
                    .setDescription('จ้างฟาร์มจากทางเรา')
                    .setEmoji('🎮')
                    .setValue('create_farm'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('พ่อค้า 1')
                    .setDescription('ติดต่อพ่อค้าโตโต้เด็กเย็ดโม้')
                    .setEmoji('🙆‍♂️')
                    .setValue('create_trade'),
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            files: [file] // *** เพิ่มบรรทัดนี้ เพื่อส่งไฟล์รูปขึ้นไปด้วย ***
        });
    }
};
