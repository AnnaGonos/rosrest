import { Controller, Get, Query } from '@nestjs/common'
import { SearchService } from './search.service'
import { SearchScope } from './search.types'

@Controller('search')
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	@Get()
	async search(
		@Query('q') query = '',
		@Query('type') type: SearchScope = 'all',
		@Query('limit') limit?: string,
	) {
		return this.searchService.search(query, type, limit ? Number(limit) : 50)
	}
}
