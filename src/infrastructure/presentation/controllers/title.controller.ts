import {
  Controller,
  Get,
  Header,
  Inject,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import path from 'path';
import { Response } from 'express';
import { stat } from 'fs/promises';
import { createReadStream, existsSync } from 'fs';

@ApiTags('Title')
@Controller('/title/:titleId')
export class TitleController {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/servers')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitleServers(
    @Param('titleId') titleId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const serversPath = path.join(
      'titles',
      titleId.toUpperCase(),
      'servers.json',
    );

    if (!existsSync(serversPath)) return [];

    const stats = await stat(serversPath);

    res.set('Content-Length', stats.size.toString());
    return new StreamableFile(createReadStream(serversPath));
  }

  @Get('/ports')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitlePorts(
    @Param('titleId') titleId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const portsPath = path.join('titles', titleId.toUpperCase(), 'ports.json');

    if (!existsSync(portsPath)) {
      return {
        // Dirty way of adding support for games that want port 1000. Should help support a lot of games.
        bind: [
          {
            info: 'Default binding.',
            port: 1000,
            mappedTo: 36001,
          },
        ],
      };
    }

    const stats = await stat(portsPath);

    res.set('Content-Length', stats.size.toString());
    return new StreamableFile(createReadStream(portsPath));
  }
}
