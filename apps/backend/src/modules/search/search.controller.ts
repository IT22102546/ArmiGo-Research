import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@common/guards";
import { SearchService } from "./search.service";

@ApiTags("Search")
@Controller("search")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get("global")
  @ApiOperation({
    summary: "Global search",
    description:
      "Search across multiple entities (users, classes, exams, etc.)",
  })
  @ApiQuery({
    name: "q",
    required: true,
    description: "Search query",
    example: "math",
  })
  @ApiQuery({
    name: "entities",
    required: false,
    description: "Comma-separated list of entities to search",
    example: "users,classes,exams",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Max results per entity",
    example: 5,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Search results retrieved successfully",
  })
  async globalSearch(
    @Query("q") query: string,
    @Query("entities") entities?: string,
    @Query("limit") limit?: string,
    @Request() req?: any
  ) {
    const entityList = entities ? entities.split(",") : undefined;
    const maxLimit = limit ? parseInt(limit) : 5;

    return this.searchService.globalSearch(
      query,
      entityList,
      maxLimit,
      req.user
    );
  }
}
