const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    AttachmentBuilder,
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_menu')
        .setDescription('สร้างเมนูสำหรับเลือกสร้างห้องอัตโนมัติ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
     async execute(interaction) {
        const file = new AttachmentBuilder('./images/Ped.png'); 

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
                    new StringSelectMenuOptionBuilder()
                    .setLabel('พ่อค้า AOTRohm')
                    .setDescription('ติดต่อพ่อค้า AOTRohm')
                    .setEmoji('🤓')
                    .setValue('create_trade_1'),
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({
            embeds: [embed],
            components: [row],
            files: [file]
        });
    }
};