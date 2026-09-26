cd /private/tmp/claude-502/-Users-lancestreuber-Desktop-HouseHack/92681206-233b-497a-85a2-112b62fa3c52/scratchpad/zba
mkdir -p pdf
while read ts url; do f=pdf/$(basename "$url"); [ -s "$f" ] && continue
curl -sL --retry 5 --retry-delay 30 --retry-connrefused --max-time 60 "https://web.archive.org/web/${ts}id_/${url}" -o "$f"; sleep 4; done < todo.txt
echo DONE
