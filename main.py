import discord
from discord.ext import commands
import yt_dlp

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix="!", intents=intents)

ytdl = yt_dlp.YoutubeDL({"format": "bestaudio/best", "quiet": True})

ffmpeg_options = {"options": "-vn"}


def search_song(query):
    info = ytdl.extract_info(f"ytsearch:{query}", download=False)
    return info["entries"][0]


class MusicMenu(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="עומר אדם", value="עומר אדם"),
            discord.SelectOption(label="סטטיק ובן אל", value="סטטיק ובן אל"),
            discord.SelectOption(label="שיר באנגלית", value="shape of you"),
        ]

        super().__init__(placeholder="בחר שיר להשמעה 🎵", options=options)

    async def callback(self, interaction: discord.Interaction):
        query = self.values[0]

        if not interaction.user.voice:
            await interaction.response.send_message("אתה חייב להיות ב־Voice", ephemeral=True)
            return

        channel = interaction.user.voice.channel
        vc = interaction.guild.voice_client

        if not vc:
            vc = await channel.connect()
        else:
            await vc.move_to(channel)

        song = search_song(query)
        url = song["url"]
        title = song["title"]

        source = await discord.FFmpegOpusAudio.from_probe(url, **ffmpeg_options)

        vc.stop()
        vc.play(source)

        await interaction.response.send_message(f"▶ מנגן: **{title}**")


class MusicView(discord.ui.View):
    def __init__(self):
        super().__init__()
        self.add_item(MusicMenu())


@bot.command()
async def music(ctx):
    await ctx.send("🎵 בחר שיר מהתפריט:", view=MusicView())


@bot.command()
async def stop(ctx):
    vc = ctx.voice_client
    if vc:
        await vc.disconnect()
        await ctx.send("⛔ עצרתי")


import os

bot.run(os.getenv("TOKEN"))
