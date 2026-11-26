let apikey = "sb_publishable_Lls4A5lleSWXBWVbACTekw__J42VWSQ"

let dates = [[[11, 22]], [[11, 28], [11, 29]], [[12, 4], [12, 5]], [[12, 11], [12, 14]]]

function decideDates() {
    let current = new Date(Date.now())
    let month = current.getMonth() + 1
    let day = current.getDate()
    console.log(month, day)

    let last = -1

    for (let i = 0; i < dates.length; i++) {
        let cluster = dates[i]
        last = i
        if (!cluster.some(([m, d]) => m > month || (m == month && d > day))) continue
        else break
    }

    return last
}

function parseTime(timeStr) {
    if (timeStr.startsWith("1ST HALF") || timeStr.startsWith("2ND HALF")) return `${timeStr.split(" ")[2].split(":")[0]}'`
    else if (timeStr.startsWith("OT")) return `${timeStr.split(" ")[1].split(":")[0]}' (OT)`
    else if (timeStr.startsWith("2OT")) return `${timeStr.split(" ")[1].split(":")[0]}' (OT/2)`
    else if (timeStr.startsWith("HALF")) return "45' (HT)"
    else return "110'"
}

function getMatches() {
    let date = dates[decideDates()]
    let start = date[0]
    let end = date[date.length - 1]
    end = [end[0], end[1] + 1]
    
    let select = "id%2Cbroadcast_name%2Cncaa_game_id%2Cscheduled_at%2Cscheduled_at_semantics%2Cstatus%2Chome_score%2Caway_score%2Cpk_home_score%2Cpk_away_score%2Cis_conference_game%2Cgame_type%2Cunresolved_opponent_name%2Cclock_display%2Chome_ncaa_division%2Caway_ncaa_division%2Chome_team%3Ateams%21matches_home_team_id_fkey%28id%2Cschool_name%2Cdisplay_name%2Cncaa_seo%2Clogo_url%3Aapp_crest%2Ctimezone%3Aapp_timezone%29%2Caway_team%3Ateams%21matches_away_team_id_fkey%28id%2Cschool_name%2Cdisplay_name%2Cncaa_seo%2Clogo_url%3Aapp_crest%2Ctimezone%3Aapp_timezone%29%2Cside_links%3Amatch_side_links%28side%2Cncaa_division%2Cteam%3Ateams%28id%2Cschool_name%2Cdisplay_name%2Cncaa_seo%2Clogo_url%3Aapp_crest%2Ctimezone%3Aapp_timezone%29%29"
    fetch(`https://api.unigoldata.app/rest/v1/matches?select=${select}&scheduled_at_semantics=eq.utc_instant&or=%28game_type.neq.exhibition%2Cgame_type.is.null%29&scheduled_at=gte.2026-${start.join("-")}T05%3A00%3A00.000Z&scheduled_at=lt.2026-${end.join("-")}T05%3A00%3A00.000Z&legacy_visible=eq.true`, {
        headers: {
            "apikey": apikey
        }
    })
    .then(res => res.json())
    .then(matchups => {
        let matchupSort = {
            "live": matchups.filter(matchup => matchup.status == "live"),
            "scheduled": matchups.filter(matchup => matchup.status == "scheduled"),
            "final": matchups.filter(matchup => matchup.status == "final")
        }
        matchupSort.live.concat(matchupSort.scheduled).concat(matchupSort.final).forEach(matchup => {
            console.log(matchup)
            let date = new Date(matchup.scheduled_at)
            let week_days = [
                "Sunday", "Monday", "Tuesday",
                "Wednesday", "Thursday", "Friday",
                "Saturday"
            ]
            let hour = date.getHours()
            let minutes = date.getMinutes().toString().padStart(2, "0")
            let tod = hour >= 12 ? "pm" : "am"
            if (hour > 12) hour -= 12
            console.log()
            let clock = ""
            let subheader = ""
            if (matchup.status == "scheduled") {
                clock = `${week_days[date.getDay()]}, ${hour.toString()}:${minutes}${tod}`
                subheader = matchup.broadcast_name ?? ""
            } else if (matchup.status == "live") {
                clock = parseTime(matchup.clock_display)
                subheader = `${matchup.away_score}-${matchup.home_score}${(matchup.pk_home_score || matchup.pk_away_score) ? ` (${matchup.pk_away_score}-${matchup.pk_home_score})` : ""}`
            } else if (matchup.status == "final") {
                clock = `FT ${matchup.away_score}-${matchup.home_score}`
                if (matchup.pk_home_score || matchup.pk_away_score) subheader = `(${matchup.pk_away_score}-${matchup.pk_home_score})`
            }
            document.querySelector(".infos").innerHTML += `
            <div class="matchup">
                <div class="teams">
                    <div class="team-box">
                        <img src="${matchup.away_team.logo_url}" alt="">
                        <h3>${matchup.away_team.display_name}</h3>
                    </div>
                    <p>at</p>
                    <div class="team-box">
                        <img src="${matchup.home_team.logo_url}" alt="">
                        <h3>${matchup.home_team.display_name}</h3>
                    </div>
                </div>
                <div class="match-status">
                    <p class="time">${clock}</p>
                    <p class="subheader">${subheader}</p>
                </div>
            </div>
            `
        })
        // 
    })
}