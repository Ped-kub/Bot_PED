const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// --- สร้าง Embed Message (เหมือนเดิม) ---
const createMenuEmbed = () => {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('บริการต่างๆ')
    .setDescription('กรุณาเลือกเมนูที่ต้องการจาก Dropdown ด้านล่าง:')
    .setImage('https://www.craiyon.com/pt/image/GmCvgfvIQ9u2BXClxXtwuQ') // **แทนที่ด้วย URL รูปภาพตัวละครของคุณ**
    .setTimestamp()
    .setFooter({ text: '© BOT By. Ped' });

  return embed;
};

// --- สร้าง Dropdown Menu ---
const createMenuDropdown = () => {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('main_menu_select')
    .setPlaceholder('เลือกบริการได้เลย')
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

  const actionRow = new ActionRowBuilder()
    .addComponents(selectMenu);

  return [actionRow]; // ส่งคืนเป็น Array ของ ActionRowBuilder
};

// --- จัดการ Interaction (การเลือก Dropdown) ---
const handleInteraction = async (interaction) => {
  // ตรวจสอบว่าเป็น String Select Menu interaction และ customId ถูกต้อง
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'main_menu_select') {
    return;
  }

  // ค่าที่ผู้ใช้เลือกจะอยู่ใน interaction.values (เป็น Array)
  const selectedValue = interaction.values[0];

  switch (selectedValue) {
    case 'copy_emoji':
      await interaction.reply({ content: 'คุณเลือกเมนู ก๊อปอิโมจิ!', ephemeral: true });
      break;
    case 'join_server':
      await interaction.reply({ content: 'คุณเลือกเมนู จอยเซิฟออโต้!', ephemeral: true });
      break;
    case 'get_badge':
      await interaction.reply({ content: 'คุณเลือกเมนู รับตราดิสคอร์ด!', ephemeral: true });
      break;
    case 'nuke_server':
      await interaction.reply({ content: 'คำเตือน: คุณเลือกเมนู Nuke เซิฟเวอร์!', ephemeral: true });
      break;
    default:
      await interaction.reply({ content: 'ไม่พบคำสั่งสำหรับตัวเลือกนี้', ephemeral: true });
  }
};

// ส่งออกฟังก์ชันที่อัปเดตแล้ว (เปลี่ยนชื่อฟังก์ชันสร้างปุ่มเป็นสร้าง dropdown)
module.exports = { createMenuEmbed, createMenuDropdown, handleInteraction };