import discord
from discord.ext import commands
import asyncio
import yt_dlp
import os

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(
    command_prefix="m!",
    intents=intents
)

YTDL_OPTIONS = {
    "format": "bestaudio/best",
    "quiet": True,
    "noplaylist": True
}

FFMPEG_OPTIONS = {
    "options": "-vn"
}


@bot.event
async def on_ready():
    print(f"✅ הבוט מחובר: {bot.user}")
    async def play_song(vc, query):
    try:
        search = f"ytsearch1:{query}"

        with yt_dlp.YoutubeDL(YTDL_OPTIONS) as ydl:
            info = ydl.extract_info(
                search,
                download=False
            )

            if "entries" not in info:
                return None

            song = info["entries"][0]

            url = song["url"]
            title = song.get("title", "שיר")

        if vc.is_playing():
            vc.stop()

        audio = discord.FFmpegPCMAudio(
            url,
            **FFMPEG_OPTIONS
        )

        vc.play(audio)

        return title

    except Exception as e:
        print("שגיאה בניגון:", e)
        return None


@bot.event
async def on_voice_state_update(member, before, after):
    vc = member.guild.voice_client

    if vc is None or vc.channel is None:
        return

    users = [
        m for m in vc.channel.members
        if not m.bot
    ]

    if len(users) == 0:
        await asyncio.sleep(10)

        if vc.is_connected():
            users = [
                m for m in vc.channel.members
                if not m.bot
            ]

            if len(users) == 0:await vc.disconnect()
                class MusicPanel(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)


    @discord.ui.button(
        label="🎵 נגן שיר",
        style=discord.ButtonStyle.green
    )
    async def play(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):

        if not interaction.user.voice:
            await interaction.response.send_message(
                "❌ אתה חייב להיות בוויס",
                ephemeral=True
            )
            return

        await interaction.response.send_message(
            "🎶 כתוב את שם השיר:",
            ephemeral=True
        )

        def check(msg):
            return (
                msg.author == interaction.user
                and msg.channel == interaction.channel
            )

        try:
            msg = await bot.wait_for(
                "message",
                check=check,
                timeout=60
            )

            channel = interaction.user.voice.channel
            vc = interaction.guild.voice_client

            if vc is None:
                vc = await channel.connect(
                    timeout=60,
                    reconnect=True
                )
            elif vc.channel != channel:
                await vc.move_to(channel)

            title = await play_song(
                vc,
                msg.content
            )

            if title:
                await interaction.followup.send(
                    f"▶ מנגן עכשיו: **{title}**"
                )
            else:
                await interaction.followup.send(
                    "❌ לא מצאתי את השיר"
                )

        except asyncio.TimeoutError:
            await interaction.followup.send(
                "⌛ נגמר הזמן"
            )


    @discord.ui.button(
        label="⏸ השהה",
        style=discord.ButtonStyle.blurple
    )
    async def pause(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc and vc.is_playing():
            vc.pause()

        await interaction.response.send_message(
            "⏸ השהיתי"
        )


    @discord.ui.button(
        label="▶ המשך",
        style=discord.ButtonStyle.green
    )
    async def resume(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc and vc.is_paused():
            vc.resume()

        await interaction.response.send_message(
            "▶ המשכתי"
        )
          @discord.ui.button(
        label="⏭ דלג",
        style=discord.ButtonStyle.gray
    )
    async def skip(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc:
            vc.stop()

        await interaction.response.send_message(
            "⏭ דילגתי"
        )


    @discord.ui.button(
        label="⛔ עצור",
        style=discord.ButtonStyle.red
    )
    async def stop(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc:
            await vc.disconnect()

        await interaction.response.send_message(
            "⛔ עצרתי"
        )


@bot.command()
async def p(ctx):

    embed = discord.Embed(
        title="🎵 Music Bot",
        description="לחץ על נגן וכתוב שם של שיר",
        color=discord.Color.blue()
    )

    await ctx.send(
        embed=embed,
        view=MusicPanel()
    )


bot.run(os.getenv("TOKEN"))  
