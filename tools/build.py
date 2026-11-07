"""한강 돗자리 빌드 스크립트.

src/ 아래로 나눠 둔 파일들을 하나로 합쳐 두 가지 결과물을 만듭니다.
  - index.html               : Vercel·깃허브 페이지에 올라가는 공개판 (Supabase 연결 포함)
  - dist/claude-artifact.html : claude.ai 아티팩트용 (claude.ai 자체 접속 기능 사용)
  - version.json             : 지금 버전과 업데이트 내용. 접속 중인 화면이 이 파일을 보고 "새 버전" 안내를 띄웁니다

사용법:  python3 tools/build.py
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
THREE = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
# 공개판: 외부 스크립트가 중간에 바뀌면 실행하지 않도록 무결성 값(SRI)을 붙임. 값은 npm 패키지 원본 파일에서 계산
#   three@0.128.0 build/three.min.js, @supabase/supabase-js@2.117.3 dist/umd/supabase.js
#   openssl dgst -sha384 -binary 파일 | openssl base64 -A
# 첫 주소가 막히거나 값이 안 맞으면 다른 CDN에서 한 번 더 받아 옴 (그래도 무결성 확인은 함)
THREE_SRI = "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu"
THREE_PUBLIC = ('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js" integrity="' + THREE_SRI + '" crossorigin="anonymous"></script>\n'
                '<script>window.THREE || document.write(\'<script src="https://unpkg.com/three@0.128.0/build/three.min.js" integrity="' + THREE_SRI + '" crossorigin="anonymous"><\\/script>\')</script>')
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
       "connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: blob:; media-src 'self' data: blob:; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; worker-src 'self' blob:; "
       "object-src 'none'; base-uri 'none'; form-action 'self'")


def read(p):
    return (SRC / p).read_text(encoding="utf-8")


def updates():
    """src/updates.json: 맨 위 항목이 최신 버전입니다. 업데이트할 때마다 맨 위에 새 항목을 추가합니다."""
    return json.loads(read("updates.json"))


def page_body():
    """claude.ai에 올리던 형태 그대로의 본문 (doctype 없이)."""
    js_files = sorted((SRC / "js").glob("*.js"))
    ups = updates()
    js = ("const APP_VERSION = " + json.dumps(ups[0]["v"]) + ", UPDATES = " + json.dumps(ups[:12], ensure_ascii=False) + ";\n"
          + "".join(f.read_text(encoding="utf-8") for f in js_files))
    return (read("head.html") + "<style>\n" + read("style.css") + "</style>\n" + read("body.html")
            + THREE + "\n<script>\n(() => {\n" + js + "})();\n</script>\n")


PUBLIC_HEAD = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="말없이 같이 앉아 강을 보는 곳, 한강 돗자리">
<meta http-equiv="Content-Security-Policy" content="__CSP__">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px}[hidden]{display:none!important}</style>
"""
ARTIFACT_HEAD = """<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style></head><body>"""


def build():
    body = page_body()
    if re.search("[​-‏‪-‮]", body):
        sys.exit("숨은 특수문자가 들어 있습니다. \\u 이스케이프로 바꿔 주세요.")
    # public: Supabase glue goes right before three.js
    glue = read("public/supabase-glue.html")
    i = body.index('<canvas id="scene"')
    top, rest = body[:i], body[i:]
    assert rest.count(THREE) == 1
    public = PUBLIC_HEAD.replace("__CSP__", CSP) + top + "</head>\n<body>\n" + rest.replace(THREE, glue + THREE_PUBLIC) + "\n</body>\n</html>\n"
    (ROOT / "index.html").write_text(public, encoding="utf-8")
    top = updates()[0]
    (ROOT / "version.json").write_text(json.dumps({"v": top["v"], "date": top["date"], "items": top["items"]}, ensure_ascii=False) + "\n", encoding="utf-8")
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "claude-artifact.html").write_text(ARTIFACT_HEAD + body + "</body></html>", encoding="utf-8")
    print("index.html", len(public.encode()), "bytes / dist/claude-artifact.html", len(body.encode()), "bytes")
    return body


if __name__ == "__main__":
    build()
