import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  getAllMatches,
  fetchStatsForMyTeamsPlayers,
  fetchMyTeamPlayers,
  getFinishedMatches,
  getMySquads,
  deleteSquadById,
  getSquadById,
} from "@/utils/supabase/functions";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { formatter, lastChangeStyle } from "@/utils/utils";
import NextMatchesValueTable from "@/components/myTeam/MyTeamMatchesValueTable";
import PointHistoryTable from "@/components/myTeam/MyTeamPointHistoryTable";

export const revalidate = 0;

// Helper function to get player stats map
function getPlayerStatsMap(stats) {
  const playerStatsMap = new Map();
  stats.forEach((stat) => {
    if (!playerStatsMap.has(stat.playerID)) {
      playerStatsMap.set(stat.playerID, []);
    }
    playerStatsMap.get(stat.playerID)?.push(stat);
  });
  return playerStatsMap;
}

function calculatePointsData(player, playerStats, matches) {
  const pointsData = {
    totalLocalPoints: 0,
    totalVisitorPoints: 0,
    localGames: 0,
    visitorGames: 0,
    averageLocalPoints: 0,
    averageVisitorPoints: 0,
  };

  const teamMatches = matches.filter(
    (m) => m.localTeamID === player.teamID || m.visitorTeamID === player.teamID
  );

  teamMatches.forEach((match) => {
    const stat = playerStats.find((s) => s.week === match.week);
    if (stat) {
      if (match.localTeamID === player.teamID) {
        pointsData.localGames++;
        pointsData.totalLocalPoints += stat.totalPoints ?? 0;
      } else {
        pointsData.visitorGames++;
        pointsData.totalVisitorPoints += stat.totalPoints ?? 0;
      }
    }
  });

  pointsData.averageLocalPoints =
    pointsData.localGames > 0
      ? pointsData.totalLocalPoints / pointsData.localGames
      : 0;
  pointsData.averageVisitorPoints =
    pointsData.visitorGames > 0
      ? pointsData.totalVisitorPoints / pointsData.visitorGames
      : 0;

  return pointsData;
}

function formatAndSortPlayerData(players, stats, matches, squads) {
  const playerStatsMap = getPlayerStatsMap(stats);

  const playersWithStatsAndPoints = players.map((player) => ({
    ...player,
    stats: playerStatsMap.get(player.playerID) || [],
    pointsData: calculatePointsData(
      player,
      playerStatsMap.get(player.playerID) || [],
      matches
    ),
  }));

  const squadsWithPlayers = squads.map((squad) => ({
    ...squad,
    players: Array.isArray(squad.playersIDS)
      ? squad.playersIDS
          .map((player) =>
            typeof player === "object" &&
            player !== null &&
            "playerID" in player
              ? playersWithStatsAndPoints.find(
                  (p) => p?.playerID === player?.playerID
                )
              : null
          )
          .filter((p) => p !== null)
      : [],
  }));

  squadsWithPlayers.forEach((squad) => {
    squad.players.sort((a, b) => {
      if (a && b) {
        if (a.positionID !== b.positionID) {
          return (a.positionID ?? 0) - (b.positionID ?? 0);
        }
        return a.playerID - b.playerID;
      }
      return 0;
    });
  });

  return squadsWithPlayers;
}

const getUserEmail = async (supabase) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return user.email;
};

export default async function MyTeam({
  params,
}: {
  params: { squadID: string };
}) {
  const squadID = params.squadID;

  const supabase = createClient();
  const email = await getUserEmail(supabase);

  if (!email) {
    return redirect("/login");
  }

  if (email) {
    const { mySquads } = await getMySquads(email);
    const playerIds = mySquads.flatMap((squad) =>
      Array.isArray(squad.playersIDS)
        ? squad.playersIDS
            .map((player) =>
              typeof player === "object" &&
              player !== null &&
              "playerID" in player
                ? player.playerID
                : null
            )
            .filter((id) => id !== null)
        : []
    );

    const [stats, players, { finishedMatches }, { allMatches: matchesData }] =
      await Promise.all([
        fetchStatsForMyTeamsPlayers(playerIds),
        fetchMyTeamPlayers(playerIds),
        getFinishedMatches(),
        getAllMatches(),
      ]);

    const squadsWithFormattedAndCalculatedData = formatAndSortPlayerData(
      players,
      stats,
      finishedMatches,
      mySquads
    );

    const team = squadsWithFormattedAndCalculatedData.find(
      (team) => team.squadID.toString() === squadID
    );

    const teamPlayers = team.players;
    const numberOfPlayers = teamPlayers.length;
    const totalMarketValue = teamPlayers.reduce(
      (acc, player) => acc + (player.marketValue || 0),
      0
    );
    const totalLastChange = teamPlayers.reduce(
      (acc, player) => acc + (player.lastMarketChange || 0),
      0
    );

    const mysquad = await getSquadById(squadID);

    return (
      <div className="w-full">
        {/* <pre>{JSON.stringify(mysquad, null, 2)}</pre> */}
        <div className="flex flex-col justify-start items-center gap-4">
          {/* TEAM INFO CARD */}

          <Card className="transition-all flex flex-row justify-between items-center  md:px-8 px-4 pt-2 pb-4 md:py-2  w-full text-xs md:text-sm  ">
            <div className="flex flex-col md:flex-row justify-between md:items-center items-start gap-2 md:gap-6 w-full ">
              <h2 className="text-lg font-semibold text-center">
                {team.squadName}
              </h2>
              <div className="flex flex-row justify-center items-center">
                <p className=" font-normal mr-2">Valor:</p>
                <p className=" font-bold">
                  {formatter.format(totalMarketValue)}
                </p>
              </div>
              <div className="flex flex-row justify-center items-center">
                <p className=" font-normal mr-2">Cambio:</p>

                {totalLastChange > 0 ? (
                  <ChevronsUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ChevronsDown className="w-4 h-4 text-red-500" />
                )}
                <p
                  className={`font-bold text-right tabular-nums text-xs md:text-sm  tracking-tighter  ${lastChangeStyle(
                    totalLastChange
                  )}`}
                >
                  {" "}
                  {formatter.format(totalLastChange)}
                </p>
              </div>
              <div className="flex flex-row justify-center items-center">
                <p className=" font-normal mr-2	">Jugadores:</p>
                <p className=" font-bold">{numberOfPlayers} /26</p>
              </div>
            </div>
          </Card>
          <NextMatchesValueTable players={teamPlayers} matches={matchesData} />

          <PointHistoryTable players={teamPlayers} matches={matchesData} />
        </div>
      </div>
    );
  }
}
