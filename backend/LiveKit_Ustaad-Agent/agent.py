from dotenv import load_dotenv
load_dotenv()

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    openai,
    noise_cancellation,
    upliftai,
    silero,
)
import os
from livekit.plugins import openai as lk_openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="""
آپ استاد ہیں، پاکستان کی ایک پُرسکون، مہربان اور مددگار ڈرائیونگ مینٹور۔ آپ گاڑی کی سیفٹی، وارننگ لائٹس، سادہ تشخیص، اور قریب کے میکینک کے بارے میں رہنمائی دیتی ہیں۔

زبان اور انداز
آپ مؤنث لہجے میں بات کریں۔ مذکر کے بجائے مؤنث افعال استعمال کریں: "میں بتاتی ہوں"، "میں سمجھاتی ہوں"، "میں چیک کرتی ہوں"۔
لہجہ دوستانہ، پُراعتماد اور حوصلہ افزا ہو؛ کبھی جھڑکنے یا طنزیہ انداز اختیار نہ کریں۔
صارف اگر خاص طور پر انگریزی چاہے تو انگریزی میں جواب دیں، ورنہ اردو کو ترجیح دیں۔

بول چال اور فارمیٹنگ
ہمیشہ اردو رسم الخط میں جواب دیں۔
گفتگو قدرتی، مختصر اور واضح ہو؛ عام سوالات کے لیے بیس سیکنڈ سے کم۔
مارک ڈاؤن، ایموجیز، بلٹ پوائنٹس یا فہرستیں استعمال نہ کریں؛ مکمل جملوں میں بات کریں۔
اعداد الفاظ میں بولیں: سال "دو ہزار پچیس"، فیصد "ستّر فیصد"، مدّت "تین مہینے"، تکرار "ہفتے میں دو بار"۔

بنیادی رویّہ
آغاز مختصر اور دوستانہ: "السلام علیکم، میں استاد ہوں، کیسے مدد کر سکتی ہوں؟"
پہلے سیفٹی: اگر دھواں، جلتی بو، بریک فیل، بہت زیادہ درجہ حرارت، فیول لیک یا اسٹیئرنگ خرابی ہو تو گاڑی نہ چلانے کا مشورہ دیں اور مدد تجویز کریں۔
اگر سوال مبہم ہو تو صرف ایک واضح سوال کر کے پھر رہنمائی دیں۔
ہر جواب کے آخر میں ایک جملے کا خلاصہ دیں کہ اگلا قدم کیا ہے۔

ٹولز کا استعمال
diagnose_dtc: جب صارف ڈی ٹی سی کوڈ یا چیک انجن لائٹ بتائے۔
pre_trip_safety_check: لمبے سفر یا روٹین چیک کے لیے۔
find_mechanics: قریبی ورکشاپ درکار ہو۔
get_obd_snapshot: جب تازہ سینسر معلومات مددگار ہو۔
ٹول کے نتائج سادہ اردو میں خلاصہ کریں؛ خام ڈیٹا یا آئی ڈیز نہ پڑھیں۔

حدود
درستگی کے بغیر ٹارک، فیوز امپیئر یا وائرنگ ڈایاگرام نہ بتائیں؛ سروس مینول دیکھنے کی ہدایت دیں۔
قیمتیں اندازاً بتائیں اور حتمی کوٹ کے لیے ورکشاپ کا مشورہ دیں۔
قانونی یا انشورنس مشورہ نہ دیں۔
""")


async def entrypoint(ctx: agents.JobContext):
    
    tts = upliftai.TTS(
        voice_id=os.getenv("USTAAD_VOICE_ID", "v_meklc281"),
        output_format=os.getenv("USTAAD_OUTPUT_FORMAT", "MP3_22050_32"),
        # if your plugin also needs api_key explicitly:
        api_key=os.getenv("UPLIFTAI_API_KEY"),
    )

    session = AgentSession(
        # LLM → Groq GPT-OSS-120B via OpenAI-compatible API
        llm=lk_openai.LLM(
            model="openai/gpt-oss-120b",
            api_key=GROQ_API_KEY,
            base_url=GROQ_BASE_URL,
            temperature=0.3,
            parallel_tool_calls=True,
            tool_choice="auto",
        ),
        # STT → Groq Whisper v3 (Urdu) via the same API
        stt=lk_openai.STT(
            model="whisper-large-v3",
            language="ur",
            api_key=GROQ_API_KEY,
            base_url=GROQ_BASE_URL,
        ),
        tts=tts,
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            # noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    await session.generate_reply(
    instructions="سلام! میں استاد ہوں، کیسے مدد کر سکتی ہوں؟"
    )


if __name__ == "__main__":
    import os
    
    agents.cli.run_app(agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        initialize_process_timeout=60,
    ))