# --- 2) Doppler CLI ---
if ! command -v doppler >/dev/null; then
  log "Installing Doppler CLI"
  curl -Ls https://cli.doppler.com/install.sh | sudo sh
fi

sudo doppler login

sudo doppler secrets --project YOUR_DOPPLER_PROJECT --config YOUR_DOPPLER_CONFIG

echo "Set DOPPLER_TOKEN in your shell or CI secret store before downloading secrets."
echo "Example:"
echo "  export DOPPLER_TOKEN=dp.st.xxxxx"
echo "  doppler secrets download --project YOUR_DOPPLER_PROJECT --config YOUR_DOPPLER_CONFIG --no-file --format json"
