const pool = require("../config/db");
const queries = require("../queries/helperqueries");

const searchDesa = async (req, res) => {
    try {
      const search = req.query.search || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
  
      // Validation for page number
      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page number. Page must be a positive integer.',
        });
      }
  
      // Validasi minimal 3 karakter untuk pencarian
      if (search.length > 0 && search.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 3 characters long.',
        });
      }
  
      const offset = (page - 1) * limit;
  
      // Query to fetch search results
      const result = await pool.query(queries.result, [`%${search}%`, limit, offset]
      );
  
      // Query to count the total matching rows
      const totalResult = await pool.query(queries.totalResult, [`%${search}%`]
      );
  
      const totalData = parseInt(totalResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(totalData / limit);
  
      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalData: totalData,
          limit: limit,
          search: search,
        },
      });
    } catch (error) {
      console.error('Error fetching village data with pagination:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching data. Please try again later.',
      });
    }
  };

module.exports = {
    searchDesa
}