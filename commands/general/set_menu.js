const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_menu')
        .setDescription('สร้างเมนูสำหรับเลือกสร้างห้องอัตโนมัติ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // เฉพาะแอดมินที่ใช้ได้
    async execute(interaction) {
        // 1. สร้าง Embed อธิบาย
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('บริการต่างๆ')
            .setDescription('เลือกบริการจากด้านล่างได้เลย')
            .setImage('https://www.craiyon.com/pt/image/GmCvgfvIQ9u2BXClxXtwuQ')
            .setTimestamp()
            .setFooter({ text: '© BOT By. Ped' });

        // 2. สร้าง Dropdown (Select Menu)
        const select = new StringSelectMenuBuilder()
            .setCustomId('room_setup')
            .setPlaceholder('เลือกบริการตรงนี้')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('ซื้อของ')
                    .setDescription('ซือของจากพี่ TOJI')
                    .setEmoji('🧺')
                    .setValue('create_item'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('จ้างฟาม')
                    .setDescription('จ้างฟามจากทางเรา')
                    .setEmoji('🎮')
                    .setValue('create_farm'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('พ่อค้า 1')
                    .setDescription('ติดต่อพ่อค้าโตโต้เด็กเย็ดโม้')
                    .setEmoji('🙆‍♂️')
                    .setValue('create_trade'),
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({
        embeds: [embed],
        components: [row]
    });
}}


