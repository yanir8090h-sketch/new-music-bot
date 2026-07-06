const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const distube = new DisTube(client, {
    leaveOnEmpty: true,
    leaveOnFinish: false,
    emitNewSongOnly: true,
});

// רישום פקודת ה-Slash בדיסקורד ברגע שהבוט נדלק
client.once('ready', async () => {
    console.log(`🤖 הבוט מחובר בתור: ${client.user.tag}`);

    const commands = [
        {
            name: 'setup',
            description: 'מציג את פאנל השליטה הפרטי במוזיקה',
        }
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 מעדכן פקודות לוכסן (Slash Commands)...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ פקודות הלוכסן עודכנו בהצלחה!');
    } catch (error) {
        console.error(error);
    }
});

// טיפול באינטראקציות (פקודות, תפריטים וכפתורים)
client.on('interactionCreate', async (interaction) => {
    const queue = distube.getQueue(interaction.guildId);

    // 1. הפעלת פקודת /setup
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup') {
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🗃️ Master Control Panel')
                .setDescription('ברוך הבא לפאנל השליטה של הבוט.\nפתח את התפריט למטה ובחר את סגנון השליטה המועדף עליך.');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_panel_style')
                .setPlaceholder('🎵 Simple (User-Friendly)')
                .addOptions([
                    { label: 'Simple (User-Friendly)', description: 'פאנל שליטה בסיסי ונוח למשתמש', value: 'style_simple', emoji: '🎵' },
                    { label: 'Advanced (Quick-Actions)', description: 'פאנל פעולות מהירות לשליטה מלאה', value: 'style_advanced', emoji: '⚡' },
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            // ephemeral: true גורם לזה שרק מי שרשם את הפקודה יראה את התפריט!
            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
    }

    // 2. החלפת תצוגה בתפריט הנפתח (מעדכן את ההודעה הנסתרת)
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_panel_style') {
        const selectedValue = interaction.values;

        if (selectedValue === 'style_simple') {
            const embedSimple = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🎵 User Friendly Control Panel')
                .setDescription('לחץ על הכפתורים למטה כדי לשלוט במוזיקה בזמן אמת!');

            const playBtn = new ButtonBuilder().setCustomId('btn_play').setLabel('נגן שיר 🎶').setStyle(ButtonStyle.Success);
            const pauseBtn = new ButtonBuilder().setCustomId('btn_pause').setLabel('הפעל/השהה ⏸️').setStyle(ButtonStyle.Primary);
            const skipBtn = new ButtonBuilder().setCustomId('btn_skip').setLabel('דילוג ⏭️').setStyle(ButtonStyle.Secondary);
            const stopBtn = new ButtonBuilder().setCustomId('btn_stop').setLabel('עצור 🛑').setStyle(ButtonStyle.Danger);

            const rowBtns = new ActionRowBuilder().addComponents(playBtn, pauseBtn, skipBtn, stopBtn);
            await interaction.update({ embeds: [embedSimple], components: [interaction.message.components[0], rowBtns] });
        } 
        
        else if (selectedValue === 'style_advanced') {
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
            await interaction.update({ embeds: [embedAdvanced], components: [interaction.message.components[0], rowBtns2] });
        }
    }

    // 3. כפתורי שליטה וחלון קופץ
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_play' || interaction.customId === 'btn_adv_play') {
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

        await interaction.deferReply({ ephemeral: true });

        if (interaction.customId === 'btn_pause' || interaction.customId === 'btn_adv_pause') {
            if (!queue) return interaction.editReply({ content: 'אין מוזיקה שמנגנת כרגע.' });
            if (queue.paused) {
                queue.resume();
                await interaction.editReply({ content: '▶️ המוזיקה חזרה לנגן.' });
            } else {
                queue.pause();
                await interaction.editReply({ content: '⏸️ המוזיקה הושהתה.' });
            }
        }

        if (interaction.customId === 'btn_adv_resume') {
            if (!queue) return interaction.editReply({ content: 'אין שיר ברשימה.' });
            if (!queue.paused) return interaction.editReply({ content: 'המוזיקה כבר מנגנת.' });
            queue.resume();
            await interaction.editReply({ content: '▶️ המוזיקה חזרה לנגן.' });
        }

        if (interaction.customId === 'btn_skip' || interaction.customId === 'btn_adv_next') {
            if (!queue) return interaction.editReply({ content: 'אין שירים נוספים בתור.' });
            try {
                await distube.skip(interaction.guildId);
                await interaction.editReply({ content: '⏭️ דילגתי לשיר הבא בתור.' });
            } catch {
                await interaction.editReply({ content: 'אין שירים נוספים ברשימה.' });
            }
        }

        if (interaction.customId === 'btn_stop' || interaction.customId === 'btn_adv_clear_leave') {
            if (!queue) return interaction.editReply({ content: 'הבוט לא מנגן כרגע.' });
            distube.stop(interaction.guildId);
            await interaction.editReply({ content: '🛑 הזרמת המוזיקה הופסקה והבוט התנתק.' });
        }
    }

    // 4. קבלת קלט מהחלון הקופץ (הזרמה)
    if (interaction.isModalSubmit() && interaction.customId === 'music_play_modal') {
        const songName = interaction.fields.getTextInputValue('song_name_input');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({ content: '❌ עליך להיכנס לחדר קולי קודם לכן!', ephemeral: true });
        }

        await interaction.reply({ content: `🔍 מחפש ומזרים מיוטיוב: **${songName}**...`, ephemeral: true });

        try {
            await distube.play(voiceChannel, songName, {
                textChannel: interaction.channel,
                member: interaction.member
            });
        } catch (error) {
            console.error(error);
        }
    }
});

// עדכוני הנגינה הכלליים בשרת
distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 מזרים עכשיו: **${song.name}** [${song.formattedDuration}]\nהופעל על ידי: ${song.user}`);
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send(`✅ התווסף לתור ההזרמה: **${song.name}**`);
});

client.login(process.env.TOKEN);
