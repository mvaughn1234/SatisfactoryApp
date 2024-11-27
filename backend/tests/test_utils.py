import unittest

from app.utils import to_snake_case

class TestToSnakeCase(unittest.TestCase):
    def test_simple_conversion(self):
        self.assertEqual(to_snake_case('mPowerConsumption'), 'power_consumption')

    def test_pascal_case(self):
        self.assertEqual(to_snake_case('ClassName'), 'class_name')

    def test_camel_case(self):
        self.assertEqual(to_snake_case('bigOverlapList'), 'big_overlap_list')

    def test_with_prefix_and_acronyms(self):
        self.assertEqual(to_snake_case('bForceLegacyBuildEffect'), 'force_legacy_build_effect')
        self.assertEqual(to_snake_case('mStartVector_VFX_Small_Start'), 'start_vector_vfx_small_start')

    def test_acronym_handling(self):
        self.assertEqual(to_snake_case('mIsPendingToKillVFX'), 'is_pending_to_kill_vfx')
        self.assertEqual(to_snake_case('ACRNYMAtStart'), 'acrnym_at_start')

    def test_prefix_underscore(self):
        self.assertEqual(to_snake_case('p_wordWord'), 'word_word')
        self.assertEqual(to_snake_case('ab_wordWord'), 'ab_word_word')
        self.assertEqual(to_snake_case('ab_wordWord'), 'ab_word_word')

if __name__ == '__main__':
    unittest.main()

