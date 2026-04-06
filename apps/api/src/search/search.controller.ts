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
		@Query('page') page?: string,
		@Query('pageSize') pageSize?: string,
		@Query('limit') limit?: string,
	) {
		const resolvedPageSize = pageSize ? Number(pageSize) : (limit ? Number(limit) : 12)
		return this.searchService.search(query, type, page ? Number(page) : 1, resolvedPageSize)
	}
}
