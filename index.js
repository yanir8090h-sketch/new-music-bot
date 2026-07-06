const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// רישום פקודת הלוכסן (/setup) ברגע שהבוט נדלק ב-Railway
client.once('ready', async () => {
    console.log(`🤖 הבוט דלוק ויציב! מחובר בתור: ${client.user.tag}`);

    const commands = [
        {
            name: 'setup',
            description: 'מציג את פאנל השליטה הפרטי שלך במוזיקה',
        }
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 מרענן פקודות לוכסן (Slash Commands)...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ פקודות הלוכסן עודכנו בהצלחה בשרת!');
    } catch (error) {
        console.error(error);
    }
});

// ניהול האינטראקציות
client.on('interactionCreate', async (interaction) => {
    
    // 1. הפעלת פקודת /setup - שולח הודעה נסתרת (ephemeral) באופן מיידי!
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🗃️ Master Control Panel')
            .setDescription('ברוך הבא לפאנל השליטה הפרטי שלך.\nלחץ על הכפתורים למטה כדי לבחור את סגנון הנגן המועדף עליך:');

        const simpleStyleBtn = new ButtonBuilder()
            .setCustomId('load_style_simple')
            .setLabel('Simple (User-Friendly) 🎵')
            .setStyle(ButtonStyle.Primary);

        const advancedStyleBtn = new ButtonBuilder()
            .setCustomId('load_style_advanced')
            .setLabel('Advanced (Quick-Actions) ⚡')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(simpleStyleBtn, advancedStyleBtn);
        
        // ephemeral: true מבטיח שרק מי שרשם את הפקודה יראה את ההודעה הזו!
        return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // 2. כאשר משתמש בוחר סגנון נגן מתוך ההודעה הנסתרת שלו
    if (interaction.isButton()) {
        const customId = interaction.customId;

        // טעינת פאנל רגיל בתוך ההודעה הנסתרת
        if (customId === 'load_style_simple') {
            const embedSimple = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🎵 User Friendly Control Panel')
                .setDescription('לחץ על הכפתורים למטה כדי לשלוט במוזיקה בזמן אמת!');

            const playBtn = new ButtonBuilder().setCustomId('btn_play').setLabel('נגן שיר 🎶').setStyle(ButtonStyle.Success);
            const pauseBtn = new ButtonBuilder().setCustomId('btn_pause').setLabel('הפעל/השהה ⏸️').setStyle(ButtonStyle.Primary);
            const skipBtn = new ButtonBuilder().setCustomId('btn_skip').setLabel('דילוג ⏭️').setStyle(ButtonStyle.Secondary);
            const stopBtn = new ButtonBuilder().setCustomId('btn_stop').setLabel('עצור 🛑').setStyle(ButtonStyle.Danger);

            const rowBtns = new ActionRowBuilder().addComponents(playBtn, pauseBtn, skipBtn, stopBtn);
            
            // מעדכן את ההודעה הנסתרת הקיימת בשבריר שנייה ובלי להיתקע!
            return await interaction.update({ embeds: [embedSimple], components: [rowBtns] });
        }

        // טעינת פאנל מתקדם בתוך ההודעה הנסתרת
        if (customId === 'load_style_advanced') {
            const embedAdvanced = new EmbedBuilder()
                .setColor('#23a55a')
                .setTitle('⚡ Advanced Quick-Actions Panel')
                .setDescription('פעולות שליטה מתקדמות ומהירות בבוט');

            const playBtn2 = new ButtonBuilder().setCustomId('btn_adv_play').setLabel('חפש ונגן שיר 🎵').setStyle(ButtonStyle.Success);
            const pauseBtn2 = new ButtonBuilder().setCustomId('btn_adv_pause').setLabel('השהה ⏸️').setStyle(ButtonStyle.Secondary);
            const resumeBtn2 = new ButtonBuilder().setCustomId('btn_adv_resume').setLabel('המשך ▶️').setStyle(ButtonStyle.Success);
            const nextBtn2 = new ButtonBuilder().setCustomId('btn_adv_next').setLabel('הבא בתור ⏭️').setStyle(ButtonStyle.Primary);
            const clearLeaveBtn2 = new ButtonBuilder().setCustomId('btn_adv_clear_leave').setLabel('ניקוי תור וניתוק 🛑').setStyle(ButtonStyle.Danger);

            const rowBtns2 = new ActionRowBuilder().addComponents(playBtn2, pauseBtn2, resumeBtn2, nextBtn2, clearLeaveBtn2);
            
            // מעדכן את ההודעה הנסתרת הקיימת בשבריר שנייה ובלי להיתקע!
            return await interaction.update({ embeds: [embedAdvanced], components: [rowBtns2] });
        }

        // פתיחת חלונית החיפוש הקופצת (Modal)
        if (customId === 'btn_play' || customId === 'btn_adv_play') {
            const modal = new ModalBuilder().setCustomId('music_play_modal').setTitle('🎵 הזרמת שיר בזמן אמת');
            const songInput = new TextInputBuilder()
                .setCustomId('song_name_input')
                .setLabel('הקש את שם השיר או קישור מיוטיוב:')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('לדוגמה: אושר כהן')
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(songInput);
            modal.addComponents(row);
            return await interaction.showModal(modal);
        }

        // אישור מהיר לכפתורי השמע האחרים
        await interaction.deferUpdate();
    }

    // 3. קבלת קלט מהחלון הקופץ שנפתח בתוך האפמראל
    if (interaction.isModalSubmit() && interaction.customId === 'music_play_modal') {
        const songName = interaction.fields.getTextInputValue('song_name_input');
        return await interaction.reply({ content: `🔍 מחפש ומזרים מיוטיוב עבורך: **${songName}**`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
