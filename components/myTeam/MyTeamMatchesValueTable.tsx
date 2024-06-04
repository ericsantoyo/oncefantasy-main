import React from "react";
import { Card } from "@/components/ui/card";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import FlightIcon from "@mui/icons-material/Flight";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatMoney,
  formatter,
  getNextGames,
  getPositionBadge,
  lastChangeStyle,
  slugById,
} from "@/utils/utils";
import Image from "next/image";

interface MyTeamMatchesValueTableProps {
  players: players[];
  matches: matches[];
}

const MyTeamMatchesValueTable: React.FC<MyTeamMatchesValueTableProps> = ({
  players,
  matches,
}) => {
  // console.log("Players in MyTeamMatchesValueTable:", players); // Log the players to verify order

  return (
    <Card className="flex flex-col justify-start items-start  w-full  ">
      <Table className="">
        <TableCaption></TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-text-center w-14">Pos</TableHead>
            <TableHead className=" text-center ">Jugador</TableHead>
            <TableHead className=" text-center ">Proximos Partidos</TableHead>
            <TableHead className=" text-center">Puntos</TableHead>
            <TableHead className=" text-center">Local</TableHead>
            <TableHead className=" text-center">Visitante</TableHead>
            <TableHead className=" text-right">Cambio</TableHead>
            <TableHead className=" text-right">Valor</TableHead>
            <TableHead className=" text-center p-0 m-0 md:hidden min-w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="p-0 m-0">
          {players.map((player, index) => {
            const nextThreeMatches = getNextGames(matches, player, 4);
            return (
              <TableRow key={player.playerID} className="">
                <TableCell className="">
                  <div
                    className={getPositionBadge(player.positionID).className}
                  >
                    {getPositionBadge(player.positionID).abbreviation}
                  </div>
                </TableCell>
                <TableCell className=" p-0 m-0 truncate min-w-[200px]">
                  <Link
                    className="flex flex-row justify-start items-center gap-1"
                    href={`/player/${player.playerID}`}
                  >
                    <div className="flex justify-center items-center flex-shrink-0 w-6 h-6">
                      <Image
                        src={`/teamLogos/${slugById(player.teamID)}.png`}
                        alt={player.teamName}
                        width={40}
                        height={40}
                        className="w-auto h-5"
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div className="flex flex-col justify-start items-center flex-shrink-0 h-10 p-0 m-0 overflow-hidden">
                      <Image
                        src={player.image}
                        alt={player.nickname}
                        width={60}
                        height={60}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div className="text-xs md:text-sm  font-semibold whitespace-nowrap shrink-0">
                      {player.nickname.includes(" ") &&
                      player.nickname.length > 12
                        ? `${player.nickname.split(" ")[0].charAt(0)}. ${
                            player.nickname.split(" ")[1]
                          }${
                            player.nickname.split(" ").length > 2
                              ? ` ${player.nickname.split(" ")[2]}`
                              : ""
                          }`
                        : player.nickname}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="bg-neutral-100 border-x-2">
                  <div className="flex justify-center items-center space-x-2">
                    {nextThreeMatches.map((match, index) => (
                      <div key={index} className="flex items-center">
                        <div className="flex justify-center items-center w-6">
                          <Image
                            src={`/teamLogos/${slugById(
                              match.localTeamID === player.teamID
                                ? match.visitorTeamID
                                : match.localTeamID
                            )}.png`}
                            alt="opponent"
                            width={24}
                            height={24}
                            className="h-6 w-auto"
                          />
                        </div>
                        <div className="flex justify-center items-center ml-1">
                          {match.visitorTeamID !== player.teamID ? (
                            <HomeIcon
                              style={{ fontSize: 18 }}
                              className="text-neutral-500"
                            />
                          ) : (
                            <FlightIcon
                              style={{ fontSize: 18 }}
                              className="rotate-45 text-neutral-400"
                            />
                          )}
                        </div>
                        {index < nextThreeMatches.length - 1 && (
                          <div className="mx-1 h-5 border-r border-gray-400"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center ">
                  <div className="flex flex-row justify-center items-center gap-0.5">
                    <p className="font-bold text-base ">{player.points}</p>
                    <div className="mx-2 h-6 border-l border-neutral-300"></div>
                    <div className="flex flex-col justify-center items-center">
                      <p className="font-bold leading-none">
                        {player.averagePoints?.toFixed(2)}
                      </p>
                      <p className="text-[11px] leading-none ">Media</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center bg-neutral-100 border-x-2">
                  <div className="flex flex-row justify-center items-center ">
                    <HomeIcon fontSize="small" className="text-neutral-400" />
                    <p className="font-bold ml-1">
                      {player.pointsData?.totalLocalPoints}
                    </p>
                    <div className="mx-2 h-6 border-l border-neutral-300"></div>
                    <div className="flex flex-col justify-center items-center">
                      <p className="font-bold leading-none">
                        {player.pointsData?.averageLocalPoints?.toFixed(2)}
                      </p>
                      <p className="text-[11px] leading-none ">Media</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-row justify-center items-center ">
                    <FlightIcon
                      fontSize="small"
                      className="rotate-45 text-neutral-400"
                    />
                    <p className="font-bold ml-1">
                      {player.pointsData?.totalVisitorPoints}
                    </p>
                    <div className="mx-2 h-6 border-l border-neutral-300"></div>
                    <div className="flex flex-col justify-center items-center">
                      <p className="font-bold leading-none">
                        {player.pointsData?.averageVisitorPoints?.toFixed(2)}
                      </p>
                      <p className="text-[11px] leading-none">Media</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className={`bg-neutral-100 border-x-2 font-bold text-right tabular-nums text-xs md:text-sm  tracking-tighter  ${lastChangeStyle(
                    player.lastMarketChange
                  )}`}
                >
                  {formatter.format(player.lastMarketChange)}
                </TableCell>
                <TableCell className="font-semibold text-right tabular-nums text-xs md:text-sm tracking-tighter ">
                  {formatMoney(player.marketValue)}
                </TableCell>
                <TableCell className="text-center p-0 m-0 md:hidden">
                  <div className="flex flex-col justify-start items-center flex-shrink-0 h-10 p-0 m-0 overflow-hidden">
                    <Image
                      src={player.image}
                      alt={player.nickname}
                      width={60}
                      height={60}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};

export default MyTeamMatchesValueTable;
