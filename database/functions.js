const { supabase } = require("./supabase");

async function addPlayers(players) {

    const { error } = await supabase
        .from('players')
        .upsert([...players])
}

async function addStats(stats) {
    const { error } = await supabase
        .from('stats')
        .upsert([...stats])
}

async function addTeams(teams) {
    const { error } = await supabase
        .from('teams')
        .upsert([...teams])
}

async function addMatches(matches) {
    const { error } = await supabase
        .from('matches')
        .upsert([...matches])
}

async function getPlayersCount() {
    const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact' })
    return count;
}

async function getTeamsCount() {
    const { count } = await supabase
        .from('teams')
        .select('*', { count: 'exact' })
    return count;
}

async function getMatchesCount() {
    const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
    return count;
}


async function deleteAllPlayers() {
    const { data: playersDeleted } = await supabase
        .from('players')
        .delete()
        .not('playerID', 'is', null)

    const { data: statsDeleted } = await supabase
        .from('stats')
        .delete()
        .not('playerID', 'is', null)

    return {data: playersDeleted, stats: statsDeleted};
}

async function deleteAllTeams() {
    const { data, error } = await supabase
        .from('teams')
        .delete()
        .not('teamID', 'is', null)
    return data;
}

async function deleteAllMatches() {
    const { data, error } = await supabase
        .from('matches')
        .delete()
        .not('matchID', 'is', null)
    return data;
}



export {
    addPlayers,
    addStats,
    addTeams,
    addMatches,
    getPlayersCount,
    getTeamsCount,
    getMatchesCount,
    deleteAllPlayers,
    deleteAllTeams,
    deleteAllMatches
};
