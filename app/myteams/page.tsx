import { createClient } from "@/utils/supabase/server";
import MyTeams from "@/components/myTeam/MySquadStats";
import {
  getAllMatches,
  fetchStatsForMyTeamsPlayers,
  fetchMyTeamPlayers,
  getFinishedMatches,
  getMySquads,
} from "@/utils/supabase/functions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Trash2, Pencil, Eye } from "lucide-react";
import AuthButton from "@/components/AuthButton";

export const revalidate = 0;

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

export default async function MyTeamsPage() {
  const supabase = createClient();
  const email = await getUserEmail(supabase);

  if (!email) {
    return redirect("/login");
  }

  try {
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

    return (
      <div className="flex flex-col justify-start items-center max-w-2xl mx-auto gap-4">
        <div className="flex justify-end w-full">
        <AuthButton />
        </div>
        <div className="flex flex-row justify-between items-center w-full pb-4">
          <h1 className="text-xl font-bold w-2/3 text-center">My Teams</h1>
          <Link className="w-1/3 flex justify-end mr-4" href="/squads">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              New Team
            </button>
          </Link>
         
        </div>
        {/* <Separator className="my-4"/> */}
        <div className="container mx-auto">
          <div className="flex flex-row justify-between items-center">
            <div className="font-bold w-1/4 text-center">Nombre</div>
            <div className="font-bold w-1/4 text-center">Jugadores</div>
            <div className="font-bold w-1/2 text-center"></div>
          </div>
          <Separator className="my-2" />

          <div className="flex flex-col justify-start gap-2">
            {mySquads.map((squad) => (
              <div
                key={squad.squadID}
                className="flex flex-row justify-between items-center"
              >
                <div className="w-1/4 flex-none text-center">
                  {squad.squadName}
                </div>
                <div className="w-1/4 flex-none text-center">
                  {Array.isArray(squad.playersIDS) ? squad.playersIDS.length : 0}/26
                </div>
                <div className="flex flex-row justify-end items-center gap-4 w-1/2 shrink-0 ">
                  <Link
                    href={`myteams/${squad.squadID}`}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold rounded p-2"
                  >
                    <Eye size={20} />
                  </Link>
                  <Link
                    href={`squads/${squad.squadID}`}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded p-2"
                  >
                    <Pencil size={20} />
                  </Link>
                  <button
                    // onClick={() => deleteSquad(squad.squadID)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold rounded p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                  {/* <Link
                    href={`lineup/${squad.squadID}`}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold rounded p-2"
                  >
                    Edit lineup
                  </Link> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    
  }
}
