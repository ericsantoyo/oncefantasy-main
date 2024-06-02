"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/database/supabase";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import Link from "next/link";
import {
  formatter,
  lastChangeStyle,
} from "@/utils/utils";
import NextMatchesValueTable from "./MyTeamMatchesValueTable";
import PointHistoryTable from "./MyTeamPointHistoryTable";

import Authentication from "../auth/Auth";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { deleteSquadById, fetchPlayersByIDs, getMySquads } from "@/database/client";

interface PlayerWithStats extends players {
  stats: stats[];
}

const MyTeams = ({ teams, matches, session }: { teams: any; matches: matches[], session: any }) => {
  const [selectedTeam, setSelectedTeam] = useState(teams[0] || null);
  const [squads, setSquads] = useState(teams || []);

  useEffect(() => {
    if (session) {
      const fetchSquads = async () => {
        const email = session.user.email;
        const { mySquads } = await getMySquads(email);

        // Fetch players for each squad
        const squadsWithPlayers = await Promise.all(
          mySquads.map(async (squad) => {
            const playerIDs = squad.playersIDS.map((p) => p.playerID);
            const players = await fetchPlayersByIDs(playerIDs);
            return {
              ...squad,
              players,
            };
          })
        );

        setSquads(squadsWithPlayers || []);
        if (squadsWithPlayers.length > 0) {
          setSelectedTeam(squadsWithPlayers[0]);
        }
      };
      fetchSquads();
    }
  }, [session]);

  const handleTeamSelect = async (teamId: string) => {
    const team = squads.find((team) => team.squadID.toString() === teamId);

    if (team) {
      const playerIDs = team.playersIDS.map((p) => p.playerID);
      const players = await fetchPlayersByIDs(playerIDs);
      setSelectedTeam({ ...team, players });
    } else {
      setSelectedTeam(null);
    }
  };

  const Logout = async () => {
    await supabase.auth.signOut();
  };

  const deleteSquad = async (squadId: string) => {
    await deleteSquadById(squadId);
    const updatedSquads = squads.filter((squad) => squad.id !== squadId);
    setSquads(updatedSquads);
    if (updatedSquads.length > 0) {
      setSelectedTeam(updatedSquads[0]);
    } else {
      setSelectedTeam(null);
    }
  };

  const selectedTeamPlayers = selectedTeam?.players || [];

  const numberOfPlayers = selectedTeamPlayers.length;
  const totalMarketValue = selectedTeamPlayers.reduce(
    (acc, player) => acc + (player.marketValue || 0),
    0
  );
  const totalLastChange = selectedTeamPlayers.reduce(
    (acc, player) => acc + (player.lastMarketChange || 0),
    0
  );

  if (!session) {
    return (
      <div>
        <h1>Please log in to see your squads.</h1>
        <Authentication
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
        />
      </div>
    );
  } else {
    return (
      <>
        <pre>{JSON.stringify(selectedTeam, null, 2)}</pre>
        <Link href="/squads">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center mt-6">
            Create Squad
          </button>
        </Link>

        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Squads</h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-bold">Squad Name</div>
            <div className="font-bold">Players</div>
            <div className="font-bold">Actions</div>
            {squads.map((squad) => (
              <React.Fragment key={squad.id}>
                <div>{squad.squadName}</div>
                <div>{squad.players ? squad.players.length : 0}/26</div> {/* Ensure squad.players exists */}

                <div className="flex">
                  <Link
                    href={`squads/${squad.id}`}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteSquad(squad.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Delete
                  </button>
                  <Link
                    href={`lineup/${squad.id}`}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Edit lineup
                  </Link>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <button onClick={Logout}>Logout</button>
        </div>
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-lg font-semibold text-center my-1">
            Mis Equipos
          </h2>
          <div className="flex w-full md:flex-row flex-col justify-between items-center gap-4">
            <Select
              value={
                selectedTeam ? selectedTeam.squadID.toString() : "Selecciona un equipo"
              }
              onValueChange={handleTeamSelect}
            >
              <SelectTrigger className="rounded-sm border bg-card text-card-foreground shadow h-full md:w-1/4">
                <SelectValue>
                  {selectedTeam
                    ? selectedTeam.squadName
                    : "Selecciona un equipo"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {squads.map((team) => (
                  <SelectItem
                    key={team.squadID}
                    value={team.squadID.toString()}
                  >
                    {team.squadName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Card className="transition-all flex flex-row justify-between items-center gap-6 md:gap-8 md:px-6 px-4 py-2 md:w-3/4 w-full text-xs md:text-sm h-full md:h-10 ">
              <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-6 w-full ">
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
                    {formatter.format(totalLastChange)}
                  </p>
                </div>
                <div className="flex flex-row justify-center items-center">
                  <p className=" font-normal mr-2	">Jugadores:</p>
                  <p className=" font-bold">{numberOfPlayers} /26</p>
                </div>
              </div>
            </Card>
          </div>

          {selectedTeam && (
            <NextMatchesValueTable
              players={selectedTeamPlayers}
              matches={matches}
            />
          )}

          {selectedTeam && (
            <PointHistoryTable
              players={selectedTeamPlayers}
              matches={matches}
            />
          )}
        </div>
      </>
    );
  }
};

export default MyTeams;
