const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// --- สร้าง Embed Message (เหมือนเดิม) ---
const createMenuEmbed = () => {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('บริการต่างๆ')
    .setDescription('กรุณาเลือกเมนูที่ต้องการจาก Dropdown ด้านล่าง:')
    .setImage('https://www.craiyon.com/pt/image/GmCvgfvIQ9u2BXClxXtwuQ')
    .setTimestamp()
    .setFooter({ text: '© BOT By. Ped' });
  return embed;
};

// --- สร้าง Dropdown Menu ---
const createMenuDropdown = () => {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('main_menu_select')
    .setPlaceholder('เลือกบริการได้เลย') // ค่านี้จะกลับมาแสดงเมื่อเราส่ง ActionRow กลับไปใหม่
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('จ้างฟาม')
        .setDescription('จ้างฟามกับทางเรา')
        .setValue('Farm'),
      new StringSelectMenuOptionBuilder()
        .setLabel('ซื้อของ')
        .setDescription('ซื้อของจากพี่ TOJI')
        .setValue('Item'),
      new StringSelectMenuOptionBuilder()
        .setLabel('ซื้อตระกูล')
        .setDescription('ซื้อตระกูลจากพี่ TOJI')
        .setValue('Bloodline'),
      new StringSelectMenuOptionBuilder()
        .setLabel('พ่อค้าโตโต้เด็กเย็ดโม้')
        .setDescription('พ่อค้า โตโต้เด็กเย็ดโม้')
        .setValue('Trade_1'),
    );

  const actionRow = new ActionRowBuilder().addComponents(selectMenu);
  return [actionRow];
};

// --- จัดการ Interaction (การเลือก Dropdown) ---
const handleInteraction = async (interaction) => {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'main_menu_select') {
    return;
  }
  
  const selectedValue = interaction.values[0];

  // 1. ใช้ interaction.update เพื่อส่ง Component เดิมกลับไป (เป็นการรีเซ็ตหน้าจอ Dropdown)
  await interaction.update({
    components: createMenuDropdown() 
  });

  // 2. ตรวจสอบเงื่อนไขตาม Value ที่เลือก (แก้ไข Case ให้ตรงกับด้านบน)
  switch (selectedValue) {
    case 'Farm':
      await interaction.followUp({ content: 'คุณเลือกเมนู: จ้างฟาม', ephemeral: true });
      break;
    case 'Item':
      await interaction.followUp({ content: 'คุณเลือกเมนู: ซื้อของ', ephemeral: true });
      break;
    case 'Bloodline':
      await interaction.followUp({ content: 'คุณเลือกเมนู: ซื้อตระกูล', ephemeral: true });
      break;
    case 'Trade_1':
      await interaction.followUp({ content: 'คุณเลือกเมนู: พ่อค้าโตโต้เด็กเย็ดโม้', ephemeral: true });
      break;
    default:
      await interaction.followUp({ content: 'ไม่พบคำสั่งสำหรับตัวเลือกนี้', ephemeral: true });
  }
};


module.exports = { createMenuEmbed, createMenuDropdown, handleInteraction };
