"""
Discord Music Bot — Master Control Panel
----------------------------------------
פאנל שליטה עם תפריט בחירת סגנון (Simple / Advanced) כמו בתמונה.

התקנה:ה:
    pip install -U "discord.py>=2.4" yt-dlp PyNaCl
    # התקן גם ffmpeg (Windows: PATH, macOS: brew install ffmpeg, Linux: apt install ffmpeg)

הרצה:
    1. צור בוט ב-https://discord.com/developers/applications
    2. Bot → הפעל MESSAGE CONTENT INTENT
    3. הזמן לשרת עם: Send Messages, Connect, Speak, Use Slash Commands
     wins export DISCORD_TOKEN=...
    5. python music_bot.py

שימוש:
    /master-panel   - שולח את "Master Control Panel" עם תפריט בחירת סגנון
"""

import os
import asyncio
from collections import deque

import discord
from discord import app_commands
from discord.ext import commands
import yt_dlp

# ---------- הגדרות ----------
TOKEN = os.getenv("DISCORD_TOKEN")

# צבעי מותג של הפאנל (תואמים לתמונה)
COLOR_GREEN = 0x2ECC71   # Simple
COLOR_YELLOW = 0xF1C40F  # Advanced

YDL_OPTS = {
    "format": "bestaudio/best",
    "noplaylist": True,
    "quiet": True,
    "default_search": "ytsearch",
    "source_address": "0.0.0.0",
}
FFMPEG_OPTS = {
    "before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
    "options": "-vn",
}

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
bot = commands.Bot(command_prefix="!", intents=intents)

# תור לכל שרת
queues: dict[int, deque] = {}


def get_queue(guild_id: int) -> deque:
    return queues.setdefault(guild_id, deque())


async def search_track(query: str) -> tuple[str, str]:
    loop = asyncio.get_running_loop()

    def _extract():
        with yt_dlp.YoutubeDL(YDL_OPTS) as ydl:
            info = ydl.extract_info(query, download=False)
            if "entries" in info:
                info = info["entries"][0]
            return info["title"], info["url"]

    return await loop.run_in_executor(None, _extract)


async def play_next(guild: discord.Guild, channel: discord.abc.Messageable):
    queue = get_queue(guild.id)
    vc = guild.voice_client
    if not queue or not vc:
        return
    title, stream_url = queue.popleft()
    source = discord.FFmpegPCMAudio(stream_url, **FFMPEG_OPTS)

    def after_playing(err):
        if err:
            print(f"Player error: {err}")
        asyncio.run_coroutine_threadsafe(play_next(guild, channel), bot.loop)

    vc.play(source, after=after_playing)
    await channel.send(f"🎵 מנגן עכשיו: **{title}**")


# ---------- Modal: הזנת שיר ----------
class SongModal(discord.ui.Modal, title="נגן שיר"):
    query = discord.ui.TextInput(
        label="שם שיר או קישור יוטיוב",
        placeholder="לדוגמה: Static Dress - Sweet",
        max_length=200,
    )

    async def on_submit(self, interaction: discord.Interaction):
        member = interaction.user
        if not isinstance(member, discord.Member) or not member.voice or not member.voice.channel:
            return await interaction.response.send_message("❌ עליך להיות בערוץ קולי.", ephemeral=True)

        await interaction.response.defer(ephemeral=True, thinking=True)
        vc = interaction.guild.voice_client
        if not vc:
            vc = await member.voice.channel.connect()
        elif vc.channel != member.voice.channel:
            await vc.move_to(member.voice.channel)

        try:
            title, stream_url = await search_track(str(self.query))
        except Exception as e:
            return await interaction.followup.send(f"❌ לא נמצא: {e}", ephemeral=True)

        get_queue(interaction.guild.id).append((title, stream_url))
        await interaction.followup.send(f"➕ נוסף לתור: **{title}**", ephemeral=True)
        if not vc.is_playing():
            await play_next(interaction.guild, interaction.channel)


# ---------- כפתורים ----------
class SimpleControls(discord.ui.View):
    """פאנל בסיסי — נגן שיר / הפעל-השהה / דילוג / ניתוק."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="נגן שיר", emoji="🎵", style=discord.ButtonStyle.success, custom_id="mp:simple:play")
    async def play_btn(self, interaction: discord.Interaction, _):
        await interaction.response.send_modal(SongModal())

    @discord.ui.button(label="הפעל/השהה", emoji="⏯️", style=discord.ButtonStyle.primary, custom_id="mp:simple:toggle")
    async def toggle_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        if not vc:
            return await interaction.response.send_message("❌ הבוט לא בערוץ.", ephemeral=True)
        if vc.is_playing():
            vc.pause();  await interaction.response.send_message("⏸️ הושהה", ephemeral=True)
        elif vc.is_paused():
            vc.resume(); await interaction.response.send_message("▶️ ממשיך", ephemeral=True)
        else:
            await interactionVideointeraction.response.send_message("שום דבר לא מתנגן.", ephemeral=True)

    @discord.ui.button(label="דילוג", emoji="⏭️", style=discord.ButtonStyle.secondary, custom_id="mp:simple:skip")
    async def skip_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        if vc and (vc.is_playing() or vc.is_paused()):
            vc.stop(); await interaction.response.send_message("⏭️ דילגתי", ephemeral=True)
        else:
            await interaction.response.send_message("אין מה לדלג.", ephemeral=True)

    @discord.ui.button(label="ניתוק", emoji="🔌", style=discord.ButtonStyle.danger, custom_id="mp:simple:leave")
    async def leave_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        queues[interaction.guild.id] = deque()
        if vc:
            await vc.disconnect()
            await interaction.response.send_message("👋 התנתקתי וניקיתי תור.", ephemeral=True)
        else:
            await interaction.response.send_message("הבוט לא מחובר.", ephemeral=True)


class AdvancedControls(discord.ui.View):
    """פאנל מתקדם — חפש/נגן, השהה, המשך, הבא בתור, ניקוי תור וניתוק."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="חפש ונגן שיר", emoji="🎵", style=discord.ButtonStyle.success, row=0, custom_id="mp:adv:play")
    async def play_btn(self, interaction: discord.Interaction, _):
        await interaction.response.send_modal(SongModal())

    @discord.ui.button(label="השהה", emoji="⏸️", style=discord.ButtonStyle.secondary, row=1, custom_id="mp:adv:pause")
    async def pause_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        if vc and vc.is_playing():
            vc.pause(); await interaction.response.send_message("⏸️ הושהה", ephemeral=True)
        else:
            await interaction.response.send_message("שום דבר לא מתנגן.", ephemeral=True)

    @discord.ui.button(label="המשך", emoji="▶️", style=discord.ButtonStyle.success, row=1, custom_id="mp:adv:resume")
    async def resume_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        if vc and vc.is_paused():
            vc.resume(); await interaction.response.send_message("▶️ ממשיך", ephemeral=True)
        else:
            await interaction.response.send_message("אין מה להמשיך.", ephemeral=True)

    @discord.ui.button(label="הבא בתור", emoji="⏭️", style=discord.ButtonStyle.primary, row=1, custom_id="mp:adv:skip")
    async def skip_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        if vc and (vc.is_playing() or vc.is_paused()):
            vc.stop(); await interaction.response.send_message("⏭️ דילגתי", ephemeral=True)
        else:
            await interaction.response.send_message("אין מה לדלג.", ephemeral=True)

    @discord.ui.button(label="ניקוי תור וניתוק", emoji="🧹", style=discord.ButtonStyle.danger, row=1, custom_id="mp:adv:stop")
    async def stop_btn(self, interaction: discord.Interaction, _):
        vc = interaction.guild.voice_client
        queues[interaction.guild.id] = deque()
        if vc:
            await vc.disconnect()
        await interaction.response.send_message("🧹 התור נוקה והתנתקתי.", ephemeral=True)


# ---------- Select: בחירת סגנון פאנל ----------
def build_simple_embed() -> discord.Embed:
    e = discord.Embed(
        title="🎵 User Friendly Control Panel",
        description="לחץ על הכפתור הירוק כדי להקליד שיר בצורה חסויה ולנגן!",
        color=COLOR_GREEN,
    )
    return e


def build_advanced_embed() -> discord.Embed:
    e = discord.Embed(
        title="⚡ Advanced Quick-Actions Panel",
        description="פעולות שליטה מתקדמות ומהירות בנגן:",
        color=COLOR_YELLOW,
    )
    return e


class StyleSelect(discord.ui.Select):
    def __init__(self):
        super().__init__(
            placeholder="בחר סגנון פאנל…",
            min_values=1,
            max_values=1,
            options=[
                discord.SelectOption(
                    label="Simple (User-Friendly)",
                    value="simple",
                    description="פאנל שליטה בסיסי ונוח למשתמש",
                    emoji="🎵",
                ),
                discord.SelectOption(
                    label="Advanced (Quick-Actions)",
                    value="advanced",
                    description="פאנל פעולות מהירות לשליטה מלאה",
                    emoji="⚡",
                ),
            ],
            custom_id="mp:master:style",
        )

    async def callback(self, interaction: discord.Interaction):
        if self.values[0] == "simple":
            await interaction.response.send_message(embed=build_simple_embed(), view=SimpleControls())
        else:
            await interaction.response.send_message(embed=build_advanced_embed(), view=AdvancedControls())


class MasterPanel(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(StyleSelect())


# ---------- פקודות ----------
@bot.event
async def on_ready():
    # Persistent views
    bot.add_view(MasterPanel())
    bot.add_view(SimpleControls())
    bot.add_view(AdvancedControls())
    try:
        synced = await bot.tree.sync()
        print(f"✅ מחובר בתור {bot.user} | סונכרנו {len(synced)} פקודות")
    except Exception as e:
        print(f"Sync error: {e}")


@bot.tree.command(name="master-panel", description="שלח את Master Control Panel")
async def master_panel_cmd(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🎛️ Master Control Panel",
        description=(
            "ברוך הבא לפאנל השליטה של הבוט.\n"
            "פתח את התפריט למטה ובחר את סגנון השליטה המועדף עליך:"
        ),
        color=COLOR_GREEN,
    )
    embed.set_footer(text="Boogie Style Music Interface")
    await interaction.response.send_message(embed=embed, view=MasterPanel())


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("❌ חסר DISCORD_TOKEN במשתני הסביבה")
    bot.run("TOKEN")
