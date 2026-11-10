
(function () {
    'use strict';

    var ID = 'lampa_ptbr_audio_v2';

    if (window[ID]) return;
    window[ID] = true;

    var enabled = true;
    var priority = 'ptbr';
    var active = false;
    var selected = false;

    function readSettings() {
        try {
            enabled = Lampa.Storage.field('ptbr_audio_enabled') !== false;
            priority = Lampa.Storage.field('ptbr_audio_priority') || 'ptbr';
        } catch (e) {}
    }

    function normalize(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/_/g, '-')
            .trim();
    }

    function getLanguage(track) {
        return normalize(
            track.language ||
            track.lang ||
            track.label ||
            track.name
        );
    }

    function rank(track) {
        var lang = getLanguage(track);

        if (!lang) return 0;

        if (/pt-br|pob|por-br|brazil|brasileir/.test(lang)) return 30;
        if (/^pt$|^pt-|portugu|^por$/.test(lang)) return 20;
        if (/^en$|^en-|english|^eng$/.test(lang)) return 10;

        return 0;
    }

    function selectAudio() {
        if (!enabled || selected || !active) return;

        try {
            var video = Lampa.PlayerVideo.video();

            if (!video || !video.audioTracks) return;

            var tracks = video.audioTracks;
            var best = null;
            var bestRank = 0;

            for (var i = 0; i < tracks.length; i++) {
                var score = rank(tracks[i]);

                if (priority === 'ptbr') {
                    if (score > bestRank) {
                        bestRank = score;
                        best = tracks[i];
                    }
                } else if (priority === 'pt') {
                    var adjusted = score === 30 ? 20 : score;
                    if (adjusted > bestRank) {
                        bestRank = adjusted;
                        best = tracks[i];
                    }
                } else if (priority === 'en') {
                    var english = score === 10 ? 30 : score;
                    if (english > bestRank) {
                        bestRank = english;
                        best = tracks[i];
                    }
                }
            }

            if (!best) return;

            best.enabled = true;
            selected = true;

            console.log(
                '[Lampa PT-BR 2.0] Áudio selecionado:',
                getLanguage(best)
            );

        } catch (error) {
            console.log('[Lampa PT-BR] Erro:', error);
        }
    }

    function onStart() {
        active = true;
        selected = false;
    }

    function onDestroy() {
        active = false;
        selected = false;
    }

    function initSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: ID,
            name: 'Lampa PT-BR Audio',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05a4.5 4.5 0 0 0 2.5-4.02z"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: 'ptbr_audio_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Seleção automática de áudio',
                description: 'Ativar ou desativar a seleção automática'
            },
            onChange: readSettings
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: 'ptbr_audio_priority',
                type: 'select',
                values: {
                    ptbr: 'Português brasileiro primeiro',
                    pt: 'Português primeiro',
                    en: 'Inglês primeiro'
                },
                default: 'ptbr'
            },
            field: {
                name: 'Idioma preferido'
            },
            onChange: readSettings
        });
    }

    function init() {
        if (!Lampa.Player || !Lampa.PlayerVideo) return;

        readSettings();
        initSettings();

        Lampa.Player.listener.follow('start', onStart);
        Lampa.Player.listener.follow('destroy', onDestroy);

        Lampa.PlayerVideo.listener.follow('canplay', selectAudio);
        Lampa.PlayerVideo.listener.follow('timeupdate', selectAudio);
        Lampa.PlayerVideo.listener.follow('tracks', selectAudio);

        console.log('[Lampa PT-BR Audio 2.0] Inicializado');
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    }
})();
